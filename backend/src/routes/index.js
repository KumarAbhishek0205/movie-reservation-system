const express = require('express');

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const genresRoutes = require('./genres.routes');
const moviesRoutes = require('./movies.routes');
const roomsRoutes = require('./rooms.routes');
const showtimesRoutes = require('./showtimes.routes');
const reservationsRoutes = require('./reservations.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/genres', genresRoutes);
router.use('/movies', moviesRoutes);
router.use('/rooms', roomsRoutes);
router.use('/showtimes', showtimesRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
