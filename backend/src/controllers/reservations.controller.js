const { query, withTransaction } = require('../db/pool');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

async function loadReservationsWithSeats(whereClause, params) {
  const reservations = await query(
    `SELECT res.*, s.start_time, s.end_time, s.base_price, s.premium_multiplier,
            m.title AS movie_title, m.poster_url, r.name AS room_name
     FROM reservations res
     JOIN showtimes s ON s.id = res.showtime_id
     JOIN movies m ON m.id = s.movie_id
     JOIN rooms r ON r.id = s.room_id
     WHERE ${whereClause}
     ORDER BY s.start_time DESC`,
    params
  );

  if (reservations.rows.length === 0) return [];

  const ids = reservations.rows.map((r) => r.id);
  const seats = await query(
    `SELECT rs.reservation_id, seat.row_label, seat.seat_number, seat.seat_type, rs.price, rs.active
     FROM reservation_seats rs
     JOIN seats seat ON seat.id = rs.seat_id
     WHERE rs.reservation_id = ANY($1)
     ORDER BY seat.row_label ASC, seat.seat_number ASC`,
    [ids]
  );

  const seatsByReservation = {};
  for (const row of seats.rows) {
    seatsByReservation[row.reservation_id] = seatsByReservation[row.reservation_id] || [];
    seatsByReservation[row.reservation_id].push(row);
  }

  return reservations.rows.map((r) => ({ ...r, seats: seatsByReservation[r.id] || [] }));
}

/**
 * POST /api/reservations
 * body: { showtime_id, seat_ids: [1, 2, 3] }
 *
 * Concurrency-safe seat booking:
 *  1. Lock the requested seat rows (FOR UPDATE) so two simultaneous
 *     requests for the same seats serialize instead of racing.
 *  2. Re-check, inside the lock, that none of them are already actively
 *     booked for this showtime.
 *  3. Insert the reservation. The partial unique index on
 *     (showtime_id, seat_id) WHERE active is the final safety net even
 *     if the locking step above were ever bypassed.
 */
const createReservation = asyncHandler(async (req, res) => {
  const { showtime_id, seat_ids } = req.body;

  if (!showtime_id || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    throw new AppError('showtime_id and a non-empty seat_ids array are required.', 422);
  }
  const uniqueSeatIds = [...new Set(seat_ids)];

  const reservation = await withTransaction(async (client) => {
    const showtimeResult = await client.query('SELECT * FROM showtimes WHERE id = $1', [
      showtime_id,
    ]);
    if (showtimeResult.rows.length === 0) throw new AppError('Showtime not found.', 404);
    const showtime = showtimeResult.rows[0];

    if (new Date(showtime.start_time).getTime() < Date.now()) {
      throw new AppError('You cannot reserve seats for a showtime that has already started.', 422);
    }

    // Lock the seat definition rows in a stable order to avoid deadlocks
    // between concurrent bookings that share some seats.
    const seatsResult = await client.query(
      `SELECT * FROM seats WHERE id = ANY($1) AND room_id = $2 ORDER BY id FOR UPDATE`,
      [uniqueSeatIds, showtime.room_id]
    );
    if (seatsResult.rows.length !== uniqueSeatIds.length) {
      throw new AppError('One or more selected seats do not belong to this showtime\'s room.', 422);
    }

    const conflictResult = await client.query(
      `SELECT seat_id FROM reservation_seats
       WHERE showtime_id = $1 AND seat_id = ANY($2) AND active = true`,
      [showtime_id, uniqueSeatIds]
    );
    if (conflictResult.rows.length > 0) {
      throw new AppError(
        'One or more selected seats were just booked by someone else. Please choose different seats.',
        409
      );
    }

    const totalPrice = seatsResult.rows.reduce((sum, seat) => {
      const price =
        seat.seat_type === 'premium'
          ? Number(showtime.base_price) * Number(showtime.premium_multiplier)
          : Number(showtime.base_price);
      return sum + price;
    }, 0);

    const reservationResult = await client.query(
      `INSERT INTO reservations (user_id, showtime_id, status, total_price)
       VALUES ($1, $2, 'confirmed', $3) RETURNING *`,
      [req.user.id, showtime_id, totalPrice.toFixed(2)]
    );
    const newReservation = reservationResult.rows[0];

    const values = [];
    const params = [];
    let p = 1;
    for (const seat of seatsResult.rows) {
      const price =
        seat.seat_type === 'premium'
          ? Number(showtime.base_price) * Number(showtime.premium_multiplier)
          : Number(showtime.base_price);
      values.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
      params.push(newReservation.id, showtime_id, seat.id, price.toFixed(2));
    }

    try {
      await client.query(
        `INSERT INTO reservation_seats (reservation_id, showtime_id, seat_id, price) VALUES ${values.join(', ')}`,
        params
      );
    } catch (err) {
      if (err.code === '23505') {
        throw new AppError(
          'One or more selected seats were just booked by someone else. Please choose different seats.',
          409
        );
      }
      throw err;
    }

    return newReservation;
  });

  const [full] = await loadReservationsWithSeats('res.id = $1', [reservation.id]);
  res.status(201).json({ reservation: full });
});

const listMyReservations = asyncHandler(async (req, res) => {
  const reservations = await loadReservationsWithSeats('res.user_id = $1', [req.user.id]);
  res.json({ reservations });
});

const cancelReservation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await withTransaction(async (client) => {
    const result = await client.query('SELECT * FROM reservations WHERE id = $1 FOR UPDATE', [id]);
    if (result.rows.length === 0) throw new AppError('Reservation not found.', 404);
    const reservation = result.rows[0];

    const isOwner = reservation.user_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      throw new AppError('You can only cancel your own reservations.', 403);
    }
    if (reservation.status === 'cancelled') {
      throw new AppError('This reservation is already cancelled.', 409);
    }

    const showtime = await client.query('SELECT start_time FROM showtimes WHERE id = $1', [
      reservation.showtime_id,
    ]);
    if (new Date(showtime.rows[0].start_time).getTime() < Date.now()) {
      throw new AppError('Past reservations cannot be cancelled.', 422);
    }

    await client.query(
      `UPDATE reservations SET status = 'cancelled', cancelled_at = now() WHERE id = $1`,
      [id]
    );
    await client.query(`UPDATE reservation_seats SET active = false WHERE reservation_id = $1`, [
      id,
    ]);
  });

  const [full] = await loadReservationsWithSeats('res.id = $1', [id]);
  res.json({ reservation: full });
});

module.exports = { createReservation, listMyReservations, cancelReservation, loadReservationsWithSeats };
