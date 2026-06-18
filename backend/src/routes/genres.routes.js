const express = require('express');
const { listGenres, createGenre, deleteGenre } = require('../controllers/genres.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', listGenres);
router.post('/', authenticate, requireAdmin, createGenre);
router.delete('/:id', authenticate, requireAdmin, deleteGenre);

module.exports = router;
