-- =====================================================================
-- CineVault — Movie Reservation System
-- PostgreSQL schema
--
-- Design notes
-- ------------
-- * Overbooking is prevented at the database level, not just in app code:
--     - `reservation_seats` has a PARTIAL UNIQUE INDEX on
--       (showtime_id, seat_id) WHERE active = true. Two confirmed
--       reservations can never hold the same seat for the same showtime,
--       even under concurrent requests — the second INSERT simply fails.
-- * Double-booking a room is prevented the same way, using a PostgreSQL
--   EXCLUDE constraint over a time range, so two showtimes can never
--   overlap in the same room.
-- * Soft-cancellation: reservations are never deleted, only marked
--   `cancelled`, which also flips `reservation_seats.active` to false and
--   frees the seats for that showtime.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------
-- Users & roles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Genres & movies (many-to-many)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS genres (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS movies (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  poster_url       VARCHAR(500),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  rating           VARCHAR(10) DEFAULT 'NR',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

-- ---------------------------------------------------------------------
-- Rooms & seats (the physical layout of a screen/auditorium)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(80) NOT NULL UNIQUE,
  rows           INTEGER NOT NULL CHECK (rows > 0),
  seats_per_row  INTEGER NOT NULL CHECK (seats_per_row > 0)
);

CREATE TABLE IF NOT EXISTS seats (
  id          SERIAL PRIMARY KEY,
  room_id     INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  row_label   VARCHAR(2) NOT NULL,
  seat_number INTEGER NOT NULL,
  seat_type   VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (seat_type IN ('standard', 'premium')),
  UNIQUE (room_id, row_label, seat_number)
);

-- ---------------------------------------------------------------------
-- Showtimes — a movie scheduled into a room for a time window
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS showtimes (
  id           SERIAL PRIMARY KEY,
  movie_id     INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  room_id      INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  base_price   NUMERIC(8,2) NOT NULL CHECK (base_price >= 0),
  premium_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.5,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  -- A room can never have two overlapping showtimes.
  EXCLUDE USING gist (room_id WITH =, tstzrange(start_time, end_time) WITH &&)
);

CREATE INDEX IF NOT EXISTS idx_showtimes_movie_start ON showtimes (movie_id, start_time);
CREATE INDEX IF NOT EXISTS idx_showtimes_start ON showtimes (start_time);

-- ---------------------------------------------------------------------
-- Reservations & the seats held within them
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  showtime_id INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
  status      VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  total_price NUMERIC(8,2) NOT NULL CHECK (total_price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reservation_seats (
  id             SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  showtime_id    INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  seat_id        INTEGER NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  price          NUMERIC(8,2) NOT NULL CHECK (price >= 0),
  active         BOOLEAN NOT NULL DEFAULT true
);

-- The core anti-overbooking guarantee: only one *active* row can exist
-- for a given (showtime, seat) pair. Cancelling a reservation sets
-- active = false, which frees the seat for re-booking.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_seat_per_showtime
  ON reservation_seats (showtime_id, seat_id)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_reservation_seats_showtime ON reservation_seats (showtime_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations (user_id);
