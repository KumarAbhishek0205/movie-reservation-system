const express = require('express');
const {
  listAllReservations,
  reportOverview,
  reportRevenue,
  reportCapacity,
} = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);
router.get('/reservations', listAllReservations);
router.get('/reports/overview', reportOverview);
router.get('/reports/revenue', reportRevenue);
router.get('/reports/capacity', reportCapacity);

module.exports = router;
