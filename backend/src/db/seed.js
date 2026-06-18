/**
 * Seeds the database with:
 *  - one admin account (from .env, or sensible defaults)
 *  - a handful of genres
 *  - two screening rooms with generated seat maps
 *  - a small catalog of movies
 *  - showtimes spread across the next 5 days
 *
 * Safe to re-run: it skips records that already exist by unique key.
 */
const bcrypt = require('bcryptjs');
const { pool, withTransaction } = require('./pool');
const config = require('../config/env');

const GENRES = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Animation', 'Romance', 'Thriller'];

const ROOMS = [
  { name: 'Room 1', rows: 6, seatsPerRow: 8 },
  { name: 'Room 2', rows: 8, seatsPerRow: 10 },
];

const MOVIES = [
  {
    title: 'Quantum Horizon',
    description:
      'A deep-space crew discovers a signal older than the universe itself, and following it may unravel everything they know about time.',
    poster_url: 'https://picsum.photos/seed/quantum-horizon/600/900',
    duration_minutes: 132,
    rating: 'PG-13',
    genres: ['Sci-Fi', 'Thriller'],
  },
  {
    title: 'Midnight in Lagos',
    description:
      'Two estranged siblings inherit their father\'s record label and have one chaotic night to save it before the bank forecloses.',
    poster_url: 'https://picsum.photos/seed/midnight-lagos/600/900',
    duration_minutes: 108,
    rating: 'PG-13',
    genres: ['Drama', 'Comedy'],
  },
  {
    title: 'The Hollow House',
    description:
      'A family moves into a renovated farmhouse only to learn the previous owners never actually left.',
    poster_url: 'https://picsum.photos/seed/hollow-house/600/900',
    duration_minutes: 97,
    rating: 'R',
    genres: ['Horror', 'Thriller'],
  },
  {
    title: 'Paper Cranes',
    description:
      'A letter delivered fifty years late sends a retired teacher across the country to find the love she never stopped writing to.',
    poster_url: 'https://picsum.photos/seed/paper-cranes/600/900',
    duration_minutes: 114,
    rating: 'PG',
    genres: ['Romance', 'Drama'],
  },
  {
    title: 'Iron Tide',
    description:
      'An ex-Navy diver is pulled back into the world she escaped when a sunken cargo ship turns out to be carrying more than scrap metal.',
    poster_url: 'https://picsum.photos/seed/iron-tide/600/900',
    duration_minutes: 121,
    rating: 'PG-13',
    genres: ['Action', 'Thriller'],
  },
  {
    title: 'The Last Punchline',
    description:
      'A washed-up comedian gets one final open-mic slot to win back the club, the crowd, and maybe his daughter.',
    poster_url: 'https://picsum.photos/seed/last-punchline/600/900',
    duration_minutes: 101,
    rating: 'PG-13',
    genres: ['Comedy', 'Drama'],
  },
  {
    title: 'Glassbound',
    description:
      'In a city built entirely from recycled glass, a young architect uncovers a structural flaw that threatens to bring it all down.',
    poster_url: 'https://picsum.photos/seed/glassbound/600/900',
    duration_minutes: 118,
    rating: 'PG',
    genres: ['Sci-Fi', 'Animation'],
  },
  {
    title: 'Foxglove Lane',
    description:
      'A detective returns to her hometown to solve a disappearance that mirrors the one she failed to solve twenty years ago.',
    poster_url: 'https://picsum.photos/seed/foxglove-lane/600/900',
    duration_minutes: 125,
    rating: 'R',
    genres: ['Thriller', 'Drama'],
  },
];

async function seedAdmin(client) {
  const { name, email, password } = config.seedAdmin;
  const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log(`Admin already exists (${email}), skipping.`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await client.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
    [name, email, passwordHash]
  );
  console.log(`Created admin account: ${email} / ${password}`);
}

async function seedGenres(client) {
  const map = {};
  for (const name of GENRES) {
    const res = await client.query(
      `INSERT INTO genres (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name]
    );
    map[name] = res.rows[0].id;
  }
  return map;
}

async function seedRooms(client) {
  const roomIds = [];
  for (const room of ROOMS) {
    let res = await client.query('SELECT id FROM rooms WHERE name = $1', [room.name]);
    let roomId;
    if (res.rows.length > 0) {
      roomId = res.rows[0].id;
    } else {
      res = await client.query(
        `INSERT INTO rooms (name, rows, seats_per_row) VALUES ($1, $2, $3) RETURNING id`,
        [room.name, room.rows, room.seatsPerRow]
      );
      roomId = res.rows[0].id;

      // Generate the seat map. The back two rows are "premium".
      const rowLabels = Array.from({ length: room.rows }, (_, i) => String.fromCharCode(65 + i));
      const values = [];
      const params = [];
      let p = 1;
      rowLabels.forEach((label, rowIdx) => {
        const isPremium = rowIdx >= room.rows - 2;
        for (let seatNum = 1; seatNum <= room.seatsPerRow; seatNum++) {
          values.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
          params.push(roomId, label, seatNum, isPremium ? 'premium' : 'standard');
        }
      });
      await client.query(
        `INSERT INTO seats (room_id, row_label, seat_number, seat_type) VALUES ${values.join(', ')}`,
        params
      );
    }
    roomIds.push(roomId);
  }
  return roomIds;
}

async function seedMovies(client, genreMap) {
  const movieIds = [];
  for (const movie of MOVIES) {
    let res = await client.query('SELECT id FROM movies WHERE title = $1', [movie.title]);
    let movieId;
    if (res.rows.length > 0) {
      movieId = res.rows[0].id;
    } else {
      res = await client.query(
        `INSERT INTO movies (title, description, poster_url, duration_minutes, rating)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [movie.title, movie.description, movie.poster_url, movie.duration_minutes, movie.rating]
      );
      movieId = res.rows[0].id;
      for (const genreName of movie.genres) {
        const genreId = genreMap[genreName];
        if (genreId) {
          await client.query(
            `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [movieId, genreId]
          );
        }
      }
    }
    movieIds.push({ id: movieId, duration: movie.duration_minutes });
  }
  return movieIds;
}

async function seedShowtimes(client, movieIds, roomIds) {
  const existing = await client.query('SELECT COUNT(*)::int AS count FROM showtimes');
  if (existing.rows[0].count > 0) {
    console.log('Showtimes already exist, skipping showtime seeding.');
    return;
  }

  const daysAhead = 5;
  const startHoursOfDay = [11, 14, 17, 20]; // showtime slots each day
  const basePrices = [9.5, 11.0, 12.5, 14.0];

  let movieCursor = 0;
  const now = new Date();

  for (let day = 0; day < daysAhead; day++) {
    for (const roomId of roomIds) {
      for (let slot = 0; slot < startHoursOfDay.length; slot++) {
        const movie = movieIds[movieCursor % movieIds.length];
        movieCursor++;

        const startTime = new Date(now);
        startTime.setDate(now.getDate() + day);
        startTime.setHours(startHoursOfDay[slot], 0, 0, 0);

        const endTime = new Date(startTime.getTime() + (movie.duration + 20) * 60000); // + 20 min cleanup/trailers

        try {
          await client.query(
            `INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [movie.id, roomId, startTime.toISOString(), endTime.toISOString(), basePrices[slot]]
          );
        } catch (err) {
          // Overlap exclusion constraint could theoretically collide across
          // rooms/days in edge cases; skip and move on rather than fail seeding.
          console.warn('Skipped a showtime due to scheduling conflict:', err.message);
        }
      }
    }
  }
}

async function seed() {
  try {
    await withTransaction(async (client) => {
      await seedAdmin(client);
      const genreMap = await seedGenres(client);
      const roomIds = await seedRooms(client);
      const movieIds = await seedMovies(client, genreMap);
      await seedShowtimes(client, movieIds, roomIds);
    });
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
