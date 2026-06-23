const axios = require('axios');
const { buildTmdbImageUrl } = require('../utils/tmdbImage');

const tmdbBaseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const tmdbApiKey = process.env.TMDB_API_KEY;
const tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN;
const tmdbLanguage = process.env.TMDB_LANGUAGE || 'en-US';


console.log("API KEY:", process.env.TMDB_API_KEY);
console.log("TOKEN:", process.env.TMDB_ACCESS_TOKEN?.slice(0, 20));

const tmdbClient = axios.create({
  baseURL: tmdbBaseUrl,
  timeout: 10000,
});

// TMDB ko batata hai ki request hamari application ne bheji hai
const getTmdbHeaders = () => {
  if (tmdbAccessToken) {
    return {
      Authorization: `Bearer ${tmdbAccessToken}`,
    };
  }

  return {};
};

// Request ke query params banata hai
// Example: ?page=1&language=en-US
const buildRequestParams = (params = {}) => {
  const requestParams = {
    language: tmdbLanguage,
    ...params,
  };

  // Agar token use nahi kar rahe to API key bhej do
  if (!tmdbAccessToken && tmdbApiKey) {
    requestParams.api_key = tmdbApiKey;
  }

  return requestParams;
};

//  TMDB request function
// Saari API calls isi ke through jayengi
const tmdbRequest = async (endpoint, params = {}) => {
  const response = await tmdbClient.get(endpoint, {
    params: buildRequestParams(params), // jo b params m ayega basically language aygi(movie ki) + page
    headers: getTmdbHeaders(), // headers ayenge iss s 
  });

  return response.data;
};

// Category wise movies fetch karta hai
// Example: popular, upcoming, top_rated
const getTmdbMovies = async (category, page = 1) => {
  return tmdbRequest(`/movie/${category}`, { page });
};

// Single movie ki complete details fetch karta hai
const getTmdbMovieDetails = async (tmdbId) => {
  return tmdbRequest(`/movie/${tmdbId}`);
};

// Poster path ko complete image URL me convert karta hai
const getPosterUrl = (path) => buildTmdbImageUrl(path, 'w500');

// Backdrop path ko complete image URL me convert karta hai
const getBackdropUrl = (path) => buildTmdbImageUrl(path, 'w1280');

module.exports = {
  getTmdbMovies,
  getTmdbMovieDetails,
  getPosterUrl,
  getBackdropUrl,
};