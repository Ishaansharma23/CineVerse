require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');
const { scheduleMovieSyncJob } = require('./jobs/movieSync.job');
const { syncAllMoviesFromTmdb } = require('./services/movieSyncService');
const {connectRedis} = require('./config/redis');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {

     // Redis connect
    await connectRedis();

    scheduleMovieSyncJob();

    return syncAllMoviesFromTmdb().catch((error) => {
      console.error('Initial TMDB sync failed:', error.message);
    });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });