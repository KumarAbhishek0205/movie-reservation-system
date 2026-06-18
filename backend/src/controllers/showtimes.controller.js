const { query, withTransaction } = require('../db/pool');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const SHOWTIME_SELECT = `
  SELECT s.*, m.title AS movie_title, m.poster_url, m.duration_minutes,
         r.name AS room_name
  FROM showtimes s
  JOIN movies m ON m.id = s.movie_id
  JOIN rooms r ON r.id = s.room_id
`;

/**
 * GET /api/showtimes?date=YYYY-MM-DD&movieId=#
 * Lists showtimes for a given date (defaults to today), optionally
 * scoped to one movie. This is the primary "browse by date" endpoint.
 */
const listShowtimes = asyncHandler(async (req, res) => {
  const { date, movieId } = req.query;
  const targetDate = date || new Date().toISOString().slice(0, 10);

  const conditions = [`s.start_time::date = $1::date`];
  const params = [targetDate];

  if (movieId) {
    params.push(movieId);
    conditions.push(`s.movie_id = $${params.length}`);
  }

  const result = await query(
    `${SHOWTIME_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY s.start_time ASC`,
    params
  );
  res.json({ showtimes: result.rows });
});

/**
 * GET /api/showtimes/:id
 * Full detail for a single showtime, including the room's seat map with
 * each seat flagged available/booked for *this* showtime specifically.
 */
const getShowtime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const showtimeResult = await query(`${SHOWTIME_SELECT} WHERE s.id = $1`, [id]);
  if (showtimeResult.rows.length === 0) throw new AppError('Showtime not found.', 404);
  const showtime = showtimeResult.rows[0];

  const seatsResult = await query(
    `SELECT seat.id, seat.row_label, seat.seat_number, seat.seat_type,
            (rs.id IS NOT NULL) AS is_booked
     FROM seats seat
     LEFT JOIN reservation_seats rs
       ON rs.seat_id = seat.id AND rs.showtime_id = $1 AND rs.active = true
     WHERE seat.room_id = $2
     ORDER BY seat.row_label ASC, seat.seat_number ASC`,
    [id, showtime.room_id]
  );

  const seats = seatsResult.rows.map((seat) => ({
    ...seat,
    price:
      seat.seat_type === 'premium'
        ? Number(showtime.base_price) * Number(showtime.premium_multiplier)
        : Number(showtime.base_price),
  }));

  res.json({ showtime, seats });
});

const createShowtime = asyncHandler(async (req, res) => {
  const { movie_id, room_id, start_time, base_price, premium_multiplier } = req.body;

  if (!movie_id || !room_id || !start_time) {
    throw new AppError('movie_id, room_id and start_time are required.', 422);
  }
  if (base_price === undefined || base_price < 0) {
    throw new AppError('base_price must be a non-negative number.', 422);
  }

  const startTime = new Date(start_time);
  if (Number.isNaN(startTime.getTime())) throw new AppError('start_time is not a valid date.', 422);
  if (startTime.getTime() < Date.now()) {
    throw new AppError('Showtimes cannot be scheduled in the past.', 422);
  }

  const movieResult = await query('SELECT duration_minutes FROM movies WHERE id = $1', [movie_id]);
  if (movieResult.rows.length === 0) throw new AppError('Movie not found.', 404);
  const { duration_minutes } = movieResult.rows[0];

  // 20-minute buffer for trailers/cleanup between screenings.
  const endTime = new Date(startTime.getTime() + (duration_minutes + 20) * 60000);

  try {
    const result = await query(
      `INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, premium_multiplier)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [movie_id, room_id, startTime.toISOString(), endTime.toISOString(), base_price, premium_multiplier || 1.5]
    );
    res.status(201).json({ showtime: result.rows[0] });
  } catch (err) {
    if (err.code === '23P01') {
      throw new AppError('That room is already booked for an overlapping time slot.', 409);
    }
    throw err;
  }
});

const updateShowtime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { start_time, base_price, premium_multiplier } = req.body;

  const existing = await query('SELECT * FROM showtimes WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Showtime not found.', 404);
  const current = existing.rows[0];

  let newStart = current.start_time;
  let newEnd = current.end_time;
  if (start_time) {
    const duration = new Date(current.end_time) - new Date(current.start_time);
    newStart = new Date(start_time);
    if (Number.isNaN(newStart.getTime())) throw new AppError('start_time is not a valid date.', 422);
    newEnd = new Date(newStart.getTime() + duration);
  }

  try {
    const result = await query(
      `UPDATE showtimes SET start_time = $1, end_time = $2, base_price = $3, premium_multiplier = $4
       WHERE id = $5 RETURNING *`,
      [
        newStart,
        newEnd,
        base_price ?? current.base_price,
        premium_multiplier ?? current.premium_multiplier,
        id,
      ]
    );
    res.json({ showtime: result.rows[0] });
  } catch (err) {
    if (err.code === '23P01') {
      throw new AppError('That room is already booked for an overlapping time slot.', 409);
    }
    throw err;
  }
});

const deleteShowtime = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await withTransaction(async (client) => {
    const reservations = await client.query(
      `SELECT id FROM reservations WHERE showtime_id = $1 AND status = 'confirmed' LIMIT 1`,
      [id]
    );
    if (reservations.rows.length > 0) {
      throw new AppError(
        'This showtime has active reservations. Cancel them before deleting the showtime.',
        409
      );
    }
    const result = await client.query('DELETE FROM showtimes WHERE id = $1 RETURNING id', [id]).catch((err) => {
      if (err.code === '23503') {
        throw new AppError(
          'This showtime has reservation history and cannot be deleted. It will simply move into the past once its start time elapses.',
          409
        );
      }
      throw err;
    });
    if (result.rows.length === 0) throw new AppError('Showtime not found.', 404);
  });

  res.status(204).send();
});

module.exports = { listShowtimes, getShowtime, createShowtime, updateShowtime, deleteShowtime };
