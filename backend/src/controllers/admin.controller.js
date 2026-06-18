const { query } = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/admin/reservations?date=&movieId=&status=
 * All reservations in the system, with the booking user attached.
 */
const listAllReservations = asyncHandler(async (req, res) => {
  const { date, movieId, status } = req.query;
  const conditions = [];
  const params = [];

  if (date) {
    params.push(date);
    conditions.push(`s.start_time::date = $${params.length}::date`);
  }
  if (movieId) {
    params.push(movieId);
    conditions.push(`s.movie_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`res.status = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT res.id, res.status, res.total_price, res.created_at, res.cancelled_at,
            u.id AS user_id, u.name AS user_name, u.email AS user_email,
            s.id AS showtime_id, s.start_time, m.title AS movie_title, r.name AS room_name,
            (SELECT COUNT(*) FROM reservation_seats rs WHERE rs.reservation_id = res.id AND rs.active = true) AS seat_count
     FROM reservations res
     JOIN showtimes s ON s.id = res.showtime_id
     JOIN movies m ON m.id = s.movie_id
     JOIN rooms r ON r.id = s.room_id
     JOIN users u ON u.id = res.user_id
     ${where}
     ORDER BY res.created_at DESC`,
    params
  );

  res.json({ reservations: result.rows });
});

/**
 * GET /api/admin/reports/overview
 * Headline numbers for the admin dashboard.
 */
const reportOverview = asyncHandler(async (req, res) => {
  const revenue = await query(
    `SELECT COALESCE(SUM(total_price), 0) AS total_revenue, COUNT(*)::int AS total_reservations
     FROM reservations WHERE status = 'confirmed'`
  );
  const upcoming = await query(
    `SELECT COUNT(*)::int AS upcoming_showtimes FROM showtimes WHERE start_time > now()`
  );
  const movies = await query(`SELECT COUNT(*)::int AS total_movies FROM movies`);
  const users = await query(`SELECT COUNT(*)::int AS total_users FROM users WHERE role = 'user'`);
  const seatsSold = await query(
    `SELECT COUNT(*)::int AS seats_sold FROM reservation_seats WHERE active = true`
  );

  res.json({
    totalRevenue: Number(revenue.rows[0].total_revenue),
    totalReservations: revenue.rows[0].total_reservations,
    upcomingShowtimes: upcoming.rows[0].upcoming_showtimes,
    totalMovies: movies.rows[0].total_movies,
    totalUsers: users.rows[0].total_users,
    seatsSold: seatsSold.rows[0].seats_sold,
  });
});

/**
 * GET /api/admin/reports/revenue?from=&to=&groupBy=day|movie
 */
const reportRevenue = asyncHandler(async (req, res) => {
  const { from, to, groupBy = 'day' } = req.query;
  const conditions = [`res.status = 'confirmed'`];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`s.start_time >= $${params.length}::date`);
  }
  if (to) {
    params.push(to);
    conditions.push(`s.start_time < ($${params.length}::date + interval '1 day')`);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  if (groupBy === 'movie') {
    const result = await query(
      `SELECT m.id AS movie_id, m.title AS movie_title,
              COALESCE(SUM(res.total_price), 0) AS revenue,
              COUNT(*)::int AS reservation_count
       FROM reservations res
       JOIN showtimes s ON s.id = res.showtime_id
       JOIN movies m ON m.id = s.movie_id
       ${where}
       GROUP BY m.id, m.title
       ORDER BY revenue DESC`,
      params
    );
    return res.json({
      groupBy: 'movie',
      rows: result.rows.map((r) => ({ ...r, revenue: Number(r.revenue) })),
    });
  }

  const result = await query(
    `SELECT s.start_time::date AS day,
            COALESCE(SUM(res.total_price), 0) AS revenue,
            COUNT(*)::int AS reservation_count
     FROM reservations res
     JOIN showtimes s ON s.id = res.showtime_id
     ${where}
     GROUP BY day
     ORDER BY day ASC`,
    params
  );
  res.json({
    groupBy: 'day',
    rows: result.rows.map((r) => ({ ...r, revenue: Number(r.revenue) })),
  });
});

/**
 * GET /api/admin/reports/capacity?from=&to=
 * Occupancy per showtime: seats sold vs. room capacity.
 */
const reportCapacity = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const conditions = [];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`s.start_time >= $${params.length}::date`);
  }
  if (to) {
    params.push(to);
    conditions.push(`s.start_time < ($${params.length}::date + interval '1 day')`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT s.id AS showtime_id, s.start_time, m.title AS movie_title, r.name AS room_name,
            r.rows * r.seats_per_row AS capacity,
            COALESCE((SELECT COUNT(*) FROM reservation_seats rs WHERE rs.showtime_id = s.id AND rs.active = true), 0)::int AS seats_sold
     FROM showtimes s
     JOIN movies m ON m.id = s.movie_id
     JOIN rooms r ON r.id = s.room_id
     ${where}
     ORDER BY s.start_time ASC`,
    params
  );

  const rows = result.rows.map((r) => ({
    ...r,
    occupancy_rate: r.capacity > 0 ? Math.round((r.seats_sold / r.capacity) * 1000) / 10 : 0,
  }));

  res.json({ rows });
});

module.exports = { listAllReservations, reportOverview, reportRevenue, reportCapacity };
