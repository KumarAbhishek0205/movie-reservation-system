# CineVault — Frontend

A Netflix-premium-styled web client for the movie reservation system: dark canvas,
red accent for primary actions, gold accent for "premium" seats/badges, and
ticket-stub styling on the reservations page.

## Stack

React 18 + Vite + Tailwind CSS, React Router, Recharts (admin charts), Axios.

## Setup

```bash
cd frontend
cp .env.example .env     # point VITE_API_URL at your backend, default http://localhost:4000/api
npm install
npm run dev               # http://localhost:5173
```

The backend must be running and seeded first (see `../backend/README.md`) — log in
with the seeded admin account to access `/admin`, or sign up as a regular user to
browse and book.

## Structure

```
src/
  api/         one file per backend resource, thin wrappers around axios
  context/     AuthContext — holds the JWT + current user, exposes login/signup/logout
  components/  shared UI: NavBar, MovieCard/Row, Hero, SeatMap, TicketStub, route guards
  pages/       Home, Login, Signup, MovieDetail, Booking (seat selection), MyReservations
  pages/admin/ Dashboard, Movies, Rooms, Showtimes, AllReservations, Reports, Users
```

## Design notes

- **Seat map** (`components/SeatMap.jsx`) renders one button per seat, grouped by row,
  with four visual states: standard, premium (gold border), selected (red fill), and
  booked (disabled, muted). Booked state always reflects the server's seat map for
  that specific showtime, refetched after a failed booking attempt in case someone
  else took a seat in the meantime.
- **Ticket stubs** (`components/TicketStub.jsx`) use a dashed-border + notch-circle
  CSS treatment (`.ticket-perforation` in `index.css`) to look like a torn ticket,
  since the whole product is literally about tickets.
- Cancel is only offered when a reservation is `confirmed` and its showtime hasn't
  started yet — mirroring the same rule enforced server-side.
- Admin routes are guarded client-side (`AdminRoute.jsx`) for UX, but the real
  authorization boundary is the backend's `requireAdmin` middleware — the client
  guard is just to avoid flashing admin UI to people who'll get a 403 anyway.
