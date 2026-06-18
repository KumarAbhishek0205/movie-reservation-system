const { query, withTransaction } = require('../db/pool');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listRooms = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT r.*, COUNT(s.id)::int AS seat_count
     FROM rooms r LEFT JOIN seats s ON s.room_id = r.id
     GROUP BY r.id ORDER BY r.name ASC`
  );
  res.json({ rooms: result.rows });
});

const getRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const room = await query('SELECT * FROM rooms WHERE id = $1', [id]);
  if (room.rows.length === 0) throw new AppError('Room not found.', 404);

  const seats = await query(
    'SELECT * FROM seats WHERE room_id = $1 ORDER BY row_label ASC, seat_number ASC',
    [id]
  );
  res.json({ room: room.rows[0], seats: seats.rows });
});

/**
 * Creates a room and generates its full seat grid. The back two rows are
 * marked "premium" by default, matching the seeded sample data.
 */
const createRoom = asyncHandler(async (req, res) => {
  const { name, rows, seats_per_row, premium_rows } = req.body;

  if (!name || !name.trim()) throw new AppError('Room name is required.', 422);
  if (!rows || rows <= 0) throw new AppError('Rows must be a positive number.', 422);
  if (!seats_per_row || seats_per_row <= 0) {
    throw new AppError('Seats per row must be a positive number.', 422);
  }
  if (rows > 26) throw new AppError('A room can have at most 26 rows (A-Z).', 422);

  const premiumRowCount = Number.isInteger(premium_rows) ? Math.max(0, premium_rows) : 0;

  const room = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO rooms (name, rows, seats_per_row) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), rows, seats_per_row]
    );
    const newRoom = result.rows[0];

    const values = [];
    const params = [];
    let p = 1;
    for (let r = 0; r < rows; r++) {
      const label = String.fromCharCode(65 + r);
      const isPremium = r >= rows - premiumRowCount;
      for (let seatNum = 1; seatNum <= seats_per_row; seatNum++) {
        values.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(newRoom.id, label, seatNum, isPremium ? 'premium' : 'standard');
      }
    }
    await client.query(
      `INSERT INTO seats (room_id, row_label, seat_number, seat_type) VALUES ${values.join(', ')}`,
      params
    );

    return newRoom;
  });

  res.status(201).json({ room });
});

const deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const inUse = await query('SELECT id FROM showtimes WHERE room_id = $1 LIMIT 1', [id]);
  if (inUse.rows.length > 0) {
    throw new AppError('Cannot delete a room that has showtimes scheduled in it.', 409);
  }
  const result = await query('DELETE FROM rooms WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError('Room not found.', 404);
  res.status(204).send();
});

module.exports = { listRooms, getRoom, createRoom, deleteRoom };
