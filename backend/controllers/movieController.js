const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const { formatMovieResponse } = require("../utils/movieFormatter");

const getMoviesByCategory = async (
  res,
  category,
  sort = { popularity: -1 },
  limit = 12,
) => {
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
    await getMoviesByCategory(res, "trending", { popularity: -1 }, 8);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecommendedMovies = async (req, res) => {
  try {
    await getMoviesByCategory(
      res,
      "recommended",
      { rating: -1, voteCount: -1 },
      10,
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUpcomingMovies = async (req, res) => {
  try {
    await getMoviesByCategory(res, "upcoming", { releaseDate: 1 }, 10);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPopularMovies = async (req, res) => {
  try {
    await getMoviesByCategory(res, "popular", { popularity: -1 }, 10);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// user ya to id se bhejega (tmdbId ya Mongo _id)
const getMovieById = async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const numericId = Number(req.params.id);

    let query = { isActive: true };
    if (isObjectId) {
      query.$or = [{ _id: req.params.id }];
      if (!isNaN(numericId)) {
        query.$or.push({ tmdbId: numericId });
      }
    } else {
      query.tmdbId = numericId;
    }

    const movie = await Movie.findOne(query);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
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
