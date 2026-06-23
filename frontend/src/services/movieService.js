import request from './api';

const normalizeMovie = (movie) => ({
  id: movie.id || movie.tmdbId,
  tmdbId: movie.tmdbId,
  title: movie.title,
  image: movie.posterUrl || movie.backdropUrl,
  bannerImage: movie.backdropUrl || movie.posterUrl,
  overview: movie.overview,
  rating: movie.rating,
  voteCount: movie.voteCount,
  genres: movie.genres,
  language: movie.language,
  releaseDate: movie.releaseDate,
  runtime: movie.runtime,
  popularity: movie.popularity,
});

export const movieService = {
  getTrendingMovies: async (limit = 4) => {
    const data = await request(`/movies/trending?limit=${limit}`);
    return {
      ...data,
      movies: (data.movies || []).map(normalizeMovie),
    };
  },

  getRecommendedMovies: async (limit = 10) => {
    const data = await request(`/movies/recommended?limit=${limit}`);
    return {
      ...data,
      movies: (data.movies || []).map(normalizeMovie),
    };
  },
};