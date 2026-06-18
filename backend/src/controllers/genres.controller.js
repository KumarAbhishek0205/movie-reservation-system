const { query } = require('../db/pool');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listGenres = asyncHandler(async (req, res) => {
  const result = await query('SELECT id, name FROM genres ORDER BY name ASC');
  res.json({ genres: result.rows });
});

const createGenre = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw new AppError('Genre name is required.', 422);

  const result = await query(
    `INSERT INTO genres (name) VALUES ($1) RETURNING id, name`,
    [name.trim()]
  );
  res.status(201).json({ genre: result.rows[0] });
});

const deleteGenre = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM genres WHERE id = $1', [id]);
  res.status(204).send();
});

module.exports = { listGenres, createGenre, deleteGenre };
