const Movie = require('../models/Movie');
const {
  getTmdbMovies,
  getTmdbMovieDetails,
  getPosterUrl,
  getBackdropUrl,
} = require('./tmdbService');

// TMDB Endpoint       hmari Category

// now_playing    ->   trending
// top_rated      ->   recommended
// upcoming       ->   upcoming
// popular        ->   popular

const movieGroups = [ // ye movie group wala neche jara isme loop chlra and then tmdb alag categores k m latest fetch kr rha data cronjs wale s
  
  { key: 'trending', endpoint: 'now_playing' }, // endpoint tmdb ko hit krne k liye h
  // tmdb m alag dalte hum use end points kehte or key yani mongodb m kiss category m store kr rhe qo h
  { key: 'recommended', endpoint: 'top_rated' },
  { key: 'upcoming', endpoint: 'upcoming' },
  { key: 'popular', endpoint: 'popular' },
];

const mapTmdbMovie = (summary, details) => ({
  tmdbId: summary.id,
  title: details.title || summary.title || '',
  overview: details.overview || summary.overview || '',
  posterPath: details.poster_path || summary.poster_path || '',
  backdropPath: details.backdrop_path || summary.backdrop_path || '',
  posterUrl: getPosterUrl(details.poster_path || summary.poster_path), // tmbd hme path deta img ki 
  // hum use url m dalre taki images frontend pr show kr ske , eg - https://image.tmdb.org/t/p/w780/{7WsyChQLEftFiDOVTGkv3hFpyyt.jpg} = path hai {m}
  backdropUrl: getBackdropUrl(details.backdrop_path || summary.backdrop_path),
  rating: details.vote_average ?? summary.vote_average ?? 0,
  voteCount: details.vote_count ?? summary.vote_count ?? 0,
  genres: Array.isArray(details.genres) ? details.genres.map((genre) => genre.name).filter(Boolean) : [],
  language: details.original_language || summary.original_language || '',
  releaseDate: details.release_date || summary.release_date || null,
  runtime: details.runtime || null,
  popularity: details.popularity ?? summary.popularity ?? 0,
  lastSyncedAt: new Date(),
  isActive: true,
});

const syncMovieGroup = async ({ key, endpoint }) => {
  const movieList = await getTmdbMovies(endpoint, 1); // 1-> pages tmbdb pages m deta hai response kyuki ek sath 1000 movies nahi bhjega
  const movies = movieList.results || []; // .result tmdb n hi dia hai jisme result hoga arr return hoga
    // Baad me compare karne ke kaam aayega
  const fetchedIds = new Set(movies.map((movie) => movie.id));
    // Har movie ko parallel process karo

  await Promise.all(
    movies.map(async (movie) => {
      try {
         // Single movie ki full details lao
        const details = await getTmdbMovieDetails(movie.id);
        // Summary + Details ko merge karke
        // MongoDB schema ke according object banao
        const movieDocument = mapTmdbMovie(movie, details);

    // MongoDB me movie update/insert karo
        await Movie.updateOne(
          { tmdbId: movie.id },
          {
            $set: movieDocument,
            $addToSet: { categories: key },
          },
          { upsert: true }
        );
      } catch (error) {
        console.error(`Failed to sync TMDB movie ${movie.id} for ${key}:`, error.message);
      }
    })
  );

   // DB me jo movies currently is category me hain unki ids nikalo
  const activeCategoryMovies = await Movie.find({ categories: key }).select('tmdbId');

  // Sirf ids nikalo
// [100,200,300]
//
// fetchedIds me latest TMDB ids hain
// Example:
// Set {100,300,400}
//
// Compare karke pata lagao kaunsi movie
// DB me hai but TMDB me ab nahi hai
//
// Result:
// removedIds = [200]
  const removedIds = activeCategoryMovies
    .map((movie) => movie.tmdbId)
    .filter((tmdbId) => !fetchedIds.has(tmdbId));

    // Agar kuch movies category se remove ho chuki hain
      // Un movies se current category hata do
  //
  // Example:
  // Before:
  // {
  //   tmdbId:200,
  //   categories:["trending"]
  // }
  //
  // After:
  // {
  //   tmdbId:200,
  //   categories:[]
  // }
  if (removedIds.length > 0) {
    await Movie.updateMany(
      { tmdbId: { $in: removedIds } },
      { $pull: { categories: key } }
    );
  }


  // Current category sync result return karo
  return {
    key, // trending/popular/upcoming/recommended
    count: movies.length, // kitni movies sync hui
    syncedIds: Array.from(fetchedIds), // latest TMDB ids
  };
};

const syncAllMoviesFromTmdb = async () => {

  // Loop:
  // trending
  // recommended
  // upcoming
  // popular
  for (const group of movieGroups) {

    // Ek category sync karo
    await syncMovieGroup(group);
  }

  // Jinki categories completely empty ho chuki hain
  //
  // Example:
  // {
  //   tmdbId:200,
  //   categories:[]
  // }
  const inactiveMovies = await Movie.find({
    categories: {
      $size: 0,
    },
  }).select('_id');

  // Aisi movies ko inactive mark kar do
  if (inactiveMovies.length > 0) {
    await Movie.updateMany(
      {
        _id: {
          $in: inactiveMovies.map(
            (movie) => movie._id
          ),
        },
      },
      {
        $set: {
          isActive: false,
        },
      }
    );
  }
};

module.exports = {
  movieGroups,
  syncAllMoviesFromTmdb,
};