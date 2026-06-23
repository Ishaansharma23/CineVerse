const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const { formatMovieResponse } = require('../utils/movieFormatter');

const getMoviesByCategory = async (res, category, sort = { popularity: -1 }, limit = 12) => {
  const movies = await Movie.find({ categories: category, isActive: true }) // mtlb abhi b tredning wgera m ha ya nahi
    .sort(sort)
    .limit(limit); // Fetch movies based on category, sort order, and limit ki kitni deni ha movies 

  res.status(200).json({
    success: true,
    count: movies.length,
    movies: movies.map(formatMovieResponse),
  });
};

const getTrendingMovies = async (req, res) => {
  try {
    await getMoviesByCategory(res, 'trending', { popularity: -1 }, 8);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecommendedMovies = async (req, res) => {
  try {
    await getMoviesByCategory(res, 'recommended', { rating: -1, voteCount: -1 }, 10);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUpcomingMovies = async (req, res) => {
  try {
    await getMoviesByCategory(res, 'upcoming', { releaseDate: 1 }, 10);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPopularMovies = async (req, res) => {
  try {
    await getMoviesByCategory(res, 'popular', { popularity: -1 }, 10);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// user ya to id se bhejega 
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findOne({
      tmdbId: Number(req.params.id), // string return krta hai toh use Number m convert kr rhe id get k liye
      isActive: true
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    res.status(200).json({
      success: true,
      movie: formatMovieResponse(movie),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getTrendingMovies,
  getRecommendedMovies,
  getUpcomingMovies,
  getPopularMovies,
  getMovieById,
};