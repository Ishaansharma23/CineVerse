const formatMovieResponse = (movie) => ({
  id: movie._id,
  tmdbId: movie.tmdbId,
  title: movie.title,
  overview: movie.overview,
  posterPath: movie.posterPath,
  backdropPath: movie.backdropPath,
  posterUrl: movie.posterUrl,
  backdropUrl: movie.backdropUrl,
  image: movie.posterUrl,
  bannerImage: movie.backdropUrl || movie.posterUrl,
  rating: movie.rating,
  voteCount: movie.voteCount,
  genres: movie.genres,
  language: movie.language,
  releaseDate: movie.releaseDate,
  runtime: movie.runtime,
  popularity: movie.popularity,
  categories: movie.categories,
});

module.exports = {
  formatMovieResponse,
};