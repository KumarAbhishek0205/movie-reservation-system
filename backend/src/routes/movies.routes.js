const express = require('express');
const {
  listMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  uploadPoster,
} = require('../controllers/movies.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadPosterImage } = require('../middleware/upload');

const router = express.Router();

router.get('/', listMovies);
router.get('/:id', getMovie);
router.post('/', authenticate, requireAdmin, createMovie);
router.put('/:id', authenticate, requireAdmin, updateMovie);
router.delete('/:id', authenticate, requireAdmin, deleteMovie);
router.post(
  '/:id/poster',
  authenticate,
  requireAdmin,
  uploadPosterImage.single('poster'),
  uploadPoster
);

module.exports = router;
