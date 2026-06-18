const express = require('express');
const {
  listShowtimes,
  getShowtime,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} = require('../controllers/showtimes.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', listShowtimes);
router.get('/:id', getShowtime);
router.post('/', authenticate, requireAdmin, createShowtime);
router.put('/:id', authenticate, requireAdmin, updateShowtime);
router.delete('/:id', authenticate, requireAdmin, deleteShowtime);

module.exports = router;
