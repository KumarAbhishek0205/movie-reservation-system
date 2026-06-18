const express = require('express');
const { listRooms, getRoom, createRoom, deleteRoom } = require('../controllers/rooms.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);
router.get('/', listRooms);
router.get('/:id', getRoom);
router.post('/', createRoom);
router.delete('/:id', deleteRoom);

module.exports = router;
