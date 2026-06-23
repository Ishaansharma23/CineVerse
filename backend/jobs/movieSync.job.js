const cron = require('node-cron');
const { syncAllMoviesFromTmdb } = require('../services/movieSyncService');

const scheduleMovieSyncJob = () => {
  cron.schedule(
    '0 2 * * *',
    async () => {
      try {
        console.log('Starting daily TMDB movie sync at 2:00 AM');
        await syncAllMoviesFromTmdb();
        console.log('TMDB movie sync completed successfully');
      } catch (error) {
        console.error('TMDB movie sync failed:', error.message);
      }
    },
    {
      timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
    }
  );
};

module.exports = {
  scheduleMovieSyncJob,
};