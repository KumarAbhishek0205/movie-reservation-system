# CineVault — Movie Reservation System

A full-stack movie reservation system: sign up, browse movies and showtimes by date,
pick exact seats on a real seat map, manage your tickets, and — as an admin — manage
movies, schedule showtimes, and see revenue/capacity reports. UI is styled in a
dark, red-accented "premium streaming app" aesthetic.

```
movie-reservation-system/
  backend/    Node.js + Express + PostgreSQL REST API
  frontend/   React + Vite + Tailwind client
```

## Quick start

You need Node.js 18+ and a PostgreSQL database. The fastest way to get Postgres
running locally is Docker:

```bash
docker run --name cinevault-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cinevault -p 5432:5432 -d postgres:16
```

Then, in two terminals:

```bash
# Terminal 1 — API
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev          # http://localhost:4000

# Terminal 2 — Web client
cd frontend
cp .env.example .env
npm install
npm run dev           # http://localhost:5173
```

Open `http://localhost:5173`. Log in with the seeded admin account
(`admin@cinevault.com` / `Admin123!` by default — see `backend/.env`) to reach the
`/admin` dashboard, or sign up as a new user to browse and book seats.

## What this project demonstrates

This was built as a learning exercise around four things the brief specifically
calls out, and it's worth pointing at exactly where each one lives:

1. **Data modeling & relationships** — see `backend/src/db/schema.sql`. Users/roles,
   movies/genres (many-to-many), rooms/seats (a seat belongs to a room; a showtime
   schedules a movie into a room for a time window), and reservations/reservation_seats
   (a reservation can hold many seats, but each seat-per-showtime can only be held by
   one active reservation).

2. **Avoiding overbooking** — enforced at the database level, not just in app code.
   `reservation_seats` has a **partial unique index** on `(showtime_id, seat_id) WHERE
   active = true`, so two confirmed reservations can never hold the same seat for the
   same showtime, even under concurrent requests. The booking endpoint additionally
   takes a row lock (`SELECT ... FOR UPDATE`) on the requested seats before checking
   availability, so simultaneous bookings serialize into a clean "seat just taken,
   please choose another" response instead of a race condition.

3. **Scheduling** — showtimes have a PostgreSQL `EXCLUDE` constraint over
   `tstzrange(start_time, end_time)` per room, so the database itself refuses to
   schedule two overlapping screenings in the same room. End times are computed from
   the movie's runtime plus a cleanup/trailer buffer.

4. **Reporting** — `backend/src/controllers/admin.controller.js` exposes revenue
   (grouped by day or by movie) and per-showtime capacity/occupancy, all computed
   with SQL aggregates rather than pulled into application memory.

## Auth model

JWT-based; signup always creates a regular `user` (never `admin` — promotion is a
separate, admin-only action via `PATCH /api/users/:id/role`). One admin account is
created by the seed script so there's always a way in. See `backend/README.md` for
the full API reference.

## Extending it

Natural next steps, in roughly the order I'd tackle them: payment processing (Stripe
test mode) before confirming a reservation instead of confirming immediately; email
confirmations/reminders; a short reservation-hold window (e.g., seats are soft-locked
for 5 minutes once selected, before requiring payment, instead of being booked
instantly); and multi-theater/multi-location support (the `rooms` table would need a
`theater_id` and a `theaters` table above it).
