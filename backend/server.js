require('dotenv').config();
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const {initSocket} = require("./config/socket.js")
const app = require('./app');
const { scheduleMovieSyncJob } = require('./jobs/movieSync.job');
const { syncAllMoviesFromTmdb } = require('./services/movieSyncService');
const {connectRedis} = require('./config/redis');
const {bookingExpiryJob} = require('./jobs/bookingExpiry.job');
const registerSocketHandlers = require("./socket/socketHandler");

const PORT = process.env.PORT || 5000;

// http server
const server = http.createServer(app);
// Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  },
});

initSocket(io);
registerSocketHandlers(io);

connectDB()
  .then(async () => {

     // Redis connect
    await connectRedis();

    scheduleMovieSyncJob();

    // Booking Expiry Cron
    bookingExpiryJob();

    return syncAllMoviesFromTmdb().catch((error) => {
      console.error('Initial TMDB sync failed:', error.message);
    });
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });