const { query, withTransaction } = require('../db/pool');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

async function attachGenres(movies) {
  if (movies.length === 0) return movies;
  const ids = movies.map((m) => m.id);
  const result = await query(
    `SELECT mg.movie_id, g.id, g.name
     FROM movie_genres mg
     JOIN genres g ON g.id = mg.genre_id
     WHERE mg.movie_id = ANY($1)`,
    [ids]
  );
  const byMovie = {};
  for (const row of result.rows) {
    byMovie[row.movie_id] = byMovie[row.movie_id] || [];
    byMovie[row.movie_id].push({ id: row.id, name: row.name });
  }
  return movies.map((m) => ({ ...m, genres: byMovie[m.id] || [] }));
}

/**
 * GET /api/movies
 * Optional query params:
 *   genre   - filter by genre id
 *   search  - case-insensitive title search
 *   date    - only movies with at least one showtime on this date (YYYY-MM-DD)
 */
const listMovies = asyncHandler(async (req, res) => {
  const { genre, search, date } = req.query;
  const conditions = [];
  const params = [];

  let baseQuery = `SELECT DISTINCT m.* FROM movies m`;

  if (genre) {
    baseQuery += ` JOIN movie_genres mg ON mg.movie_id = m.id`;
    params.push(genre);
    conditions.push(`mg.genre_id = $${params.length}`);
  }

  if (date) {
    baseQuery += ` JOIN showtimes s ON s.movie_id = m.id`;
    params.push(date);
    conditions.push(`s.start_time::date = $${params.length}::date`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`m.title ILIKE $${params.length}`);
  }

  if (conditions.length > 0) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;
  }
  baseQuery += ` ORDER BY m.created_at DESC`;

  const result = await query(baseQuery, params);
  const movies = await attachGenres(result.rows);
  res.json({ movies });
});

const getMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM movies WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError('Movie not found.', 404);

  const [movie] = await attachGenres(result.rows);
  res.json({ movie });
});

const createMovie = asyncHandler(async (req, res) => {
  const { title, description, poster_url, duration_minutes, rating, genreIds } = req.body;

  if (!title || !title.trim()) throw new AppError('Title is required.', 422);
  if (!duration_minutes || duration_minutes <= 0) {
    throw new AppError('Duration (minutes) must be a positive number.', 422);
  }

  const movie = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO movies (title, description, poster_url, duration_minutes, rating)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title.trim(), description || '', poster_url || null, duration_minutes, rating || 'NR']
    );
    const newMovie = result.rows[0];

    if (Array.isArray(genreIds) && genreIds.length > 0) {
      const values = genreIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO movie_genres (movie_id, genre_id) VALUES ${values}`,
        [newMovie.id, ...genreIds]
      );
    }
    return newMovie;
  });

  const [withGenres] = await attachGenres([movie]);
  res.status(201).json({ movie: withGenres });
});

const updateMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, poster_url, duration_minutes, rating, genreIds } = req.body;

  const movie = await withTransaction(async (client) => {
    const existing = await client.query('SELECT * FROM movies WHERE id = $1', [id]);
    if (existing.rows.length === 0) throw new AppError('Movie not found.', 404);
    const current = existing.rows[0];

    const result = await client.query(
      `UPDATE movies
       SET title = $1, description = $2, poster_url = $3, duration_minutes = $4, rating = $5
       WHERE id = $6 RETURNING *`,
      [
        title?.trim() || current.title,
        description ?? current.description,
        poster_url ?? current.poster_url,
        duration_minutes || current.duration_minutes,
        rating || current.rating,
        id,
      ]
    );

    if (Array.isArray(genreIds)) {
      await client.query('DELETE FROM movie_genres WHERE movie_id = $1', [id]);
      if (genreIds.length > 0) {
        const values = genreIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(`INSERT INTO movie_genres (movie_id, genre_id) VALUES ${values}`, [
          id,
          ...genreIds,
        ]);
      }
    }

    return result.rows[0];
  });

  const [withGenres] = await attachGenres([movie]);
  res.json({ movie: withGenres });
});

const deleteMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('DELETE FROM movies WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError('Movie not found.', 404);
  res.status(204).send();
});

const uploadPoster = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.file) throw new AppError('No image file was uploaded.', 422);

  const posterUrl = `/uploads/${req.file.filename}`;
  const result = await query(
    'UPDATE movies SET poster_url = $1 WHERE id = $2 RETURNING *',
    [posterUrl, id]
  );
  if (result.rows.length === 0) throw new AppError('Movie not found.', 404);

  const [withGenres] = await attachGenres([result.rows[0]]);
  res.json({ movie: withGenres });
});

module.exports = { listMovies, getMovie, createMovie, updateMovie, deleteMovie, uploadPoster };
