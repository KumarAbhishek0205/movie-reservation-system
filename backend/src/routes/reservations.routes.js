const express = require('express');
const {
  createReservation,
  listMyReservations,
  cancelReservation,
} = require('../controllers/reservations.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.post('/', createReservation);
router.get('/me', listMyReservations);
router.delete('/:id', cancelReservation);

module.exports = router;
