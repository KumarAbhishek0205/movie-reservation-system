# CineVault — Backend API

A REST API for a movie reservation system: auth with roles, movie/genre management,
showtime scheduling, concurrency-safe seat reservations, and admin reporting.

## Stack

- Node.js + Express
- PostgreSQL (raw SQL via `pg`, no ORM — so every query and constraint is visible)
- JWT auth, bcrypt password hashing

## Why PostgreSQL specifically

Two business rules are enforced as **database constraints**, not just application code,
so they hold even under concurrent requests or a buggy client:

1. **No double-booked seats** — `reservation_seats` has a partial unique index on
   `(showtime_id, seat_id) WHERE active = true`. Two confirmed reservations can never
   hold the same seat for the same showtime.
2. **No overlapping showtimes in the same room** — `showtimes` has a PostgreSQL
   `EXCLUDE` constraint over a `tstzrange(start_time, end_time)`, so the database itself
   refuses to schedule two overlapping screenings in one room.

The booking endpoint also takes a row lock (`SELECT ... FOR UPDATE`) on the seats being
requested before checking availability, so two people clicking "confirm" on the same
seat at the same millisecond will be serialized rather than racing — the constraint is
the backstop, the lock is what makes it user-friendly (a clear 409 instead of a generic
DB error).

## Setup

```bash
cd backend
cp .env.example .env     # then edit JWT_SECRET and DB credentials
npm install
npm run db:migrate       # creates tables
npm run db:seed          # creates the admin account, sample movies, rooms & showtimes
npm run dev              # starts on http://localhost:4000
```

You need a running PostgreSQL instance reachable with the credentials in `.env`.
Easiest local option:

```bash
docker run --name cinevault-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cinevault -p 5432:5432 -d postgres:16
```

After seeding, the admin login printed in the seed output (defaults to
`admin@cinevault.com` / `Admin123!` unless you changed `.env`) can log in and manage
movies, showtimes, and reports.

## Data model

```
users            (id, name, email, password_hash, role)
genres           (id, name)
movies           (id, title, description, poster_url, duration_minutes, rating)
movie_genres     (movie_id, genre_id)               -- many-to-many
rooms            (id, name, rows, seats_per_row)
seats            (id, room_id, row_label, seat_number, seat_type)
showtimes        (id, movie_id, room_id, start_time, end_time, base_price, premium_multiplier)
reservations     (id, user_id, showtime_id, status, total_price, cancelled_at)
reservation_seats(id, reservation_id, showtime_id, seat_id, price, active)
```

`reservation_seats` denormalizes `showtime_id` (rather than joining through
`reservations`) purely so the availability-checking query and the partial unique index
can be a single-table lookup instead of a join — that index is on the hot path of every
booking request.

## API reference

All authenticated routes expect `Authorization: Bearer <token>`.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create a regular-user account |
| POST | `/api/auth/login` | — | Get a JWT |
| GET | `/api/auth/me` | user | Current user profile |

### Users (admin)
| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| PATCH | `/api/users/:id/role` | Promote/demote a user (`{ role: "admin" \| "user" }`) |

### Genres
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/genres` | — | List genres |
| POST | `/api/genres` | admin | Create a genre |
| DELETE | `/api/genres/:id` | admin | Delete a genre |

### Movies
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/movies?genre=&search=&date=` | — | Browse/filter movies |
| GET | `/api/movies/:id` | — | Movie details |
| POST | `/api/movies` | admin | Create a movie (`genreIds: [1,2]`) |
| PUT | `/api/movies/:id` | admin | Update a movie |
| DELETE | `/api/movies/:id` | admin | Delete a movie |

### Rooms (admin)
| Method | Path | Description |
|---|---|---|
| GET | `/api/rooms` | List rooms with seat counts |
| GET | `/api/rooms/:id` | Room + full seat list |
| POST | `/api/rooms` | Create a room; generates its seat grid (`{ name, rows, seats_per_row, premium_rows }`) |
| DELETE | `/api/rooms/:id` | Delete a room (blocked if it has showtimes) |

### Showtimes
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/showtimes?date=YYYY-MM-DD&movieId=` | — | Showtimes for a date |
| GET | `/api/showtimes/:id` | — | Showtime + seat map (booked/available) |
| POST | `/api/showtimes` | admin | Schedule a showtime |
| PUT | `/api/showtimes/:id` | admin | Reschedule / reprice |
| DELETE | `/api/showtimes/:id` | admin | Delete (blocked if active reservations exist) |

### Reservations
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reservations` | user | `{ showtime_id, seat_ids: [1,2] }` |
| GET | `/api/reservations/me` | user | My reservations (past + upcoming) |
| DELETE | `/api/reservations/:id` | user/admin | Cancel an upcoming reservation |

### Admin reports
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/reservations?date=&movieId=&status=` | All reservations, any user |
| GET | `/api/admin/reports/overview` | Headline dashboard numbers |
| GET | `/api/admin/reports/revenue?from=&to=&groupBy=day\|movie` | Revenue breakdown |
| GET | `/api/admin/reports/capacity?from=&to=` | Occupancy per showtime |
