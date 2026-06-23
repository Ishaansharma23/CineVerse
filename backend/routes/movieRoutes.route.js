const express = require('express');
const {
  getTrendingMovies,
  getRecommendedMovies,
  getUpcomingMovies,
  getPopularMovies,
  getMovieById,
} = require('../controllers/movieController');

const router = express.Router();

router.get('/trending', getTrendingMovies);
router.get('/recommended', getRecommendedMovies);
router.get('/upcoming', getUpcomingMovies);
router.get('/popular', getPopularMovies);
router.get('/:id', getMovieById);

module.exports = router;