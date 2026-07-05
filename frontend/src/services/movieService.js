import request from './api';

const normalizeMovie = (movie) => ({
  id: movie._id || movie.id,
  tmdbId: movie.tmdbId,
  title: movie.title,
  image: movie.posterUrl || movie.backdropUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=350',
  bannerImage: movie.backdropUrl || movie.posterUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=1200',
  overview: movie.overview || 'No overview available.',
  rating: movie.rating || 0,
  voteCount: movie.voteCount || 0,
  genres: movie.genres || [],
  language: movie.language || 'English',
  releaseDate: movie.releaseDate,
  runtime: movie.runtime,
  popularity: movie.popularity || 0,
});

export const movieService = {
  getTrendingMovies: async (limit = 8) => {
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

  getUpcomingMovies: async (limit = 10) => {
    const data = await request(`/movies/upcoming?limit=${limit}`);
    return {
      ...data,
      movies: (data.movies || []).map(normalizeMovie),
    };
  },

  getPopularMovies: async (limit = 10) => {
    const data = await request(`/movies/popular?limit=${limit}`);
    return {
      ...data,
      movies: (data.movies || []).map(normalizeMovie),
    };
  },

  getMovieById: async (tmdbId) => {
    const data = await request(`/movies/${tmdbId}`);
    return {
      ...data,
      movie: data.movie ? normalizeMovie(data.movie) : null,
    };
  },
};