const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';
const TMDB_IMAGE_SIZE = process.env.TMDB_IMAGE_SIZE || 'w780';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_LANGUAGE = process.env.TMDB_LANGUAGE || 'en-US';
const CRON_TIMEZONE = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

module.exports = {
  TMDB_BASE_URL,
  TMDB_IMAGE_BASE_URL,
  TMDB_IMAGE_SIZE,
  TMDB_API_KEY,
  TMDB_ACCESS_TOKEN,
  TMDB_LANGUAGE,
  CRON_TIMEZONE,
};