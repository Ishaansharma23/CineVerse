require("dotenv").config();
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("./config/socket.js");
const app = require("./app");
const { scheduleMovieSyncJob } = require("./jobs/movieSync.job");
const { syncAllMoviesFromTmdb } = require("./services/movieSyncService");
const { connectRedis } = require("./config/redis");
const { bookingExpiryJob } = require("./jobs/bookingExpiry.job");
const { abandonedBookingReminderJob } = require("./jobs/abandonedBookingReminder.job");
const registerSocketHandlers = require("./socket/socketHandler");

const PORT = process.env.PORT || 5000;

// http server
const server = http.createServer(app);
// Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174" , process.env.FRONTEND_URL],
    credentials: true,
  },  
});

initSocket(io);
registerSocketHandlers(io);

connectDB()
  .then(async () => {
    // Seed default pricing config if not present
    const { seedPricingConfig } = require("./services/pricingService");
    await seedPricingConfig();

    // Redis connect
    await connectRedis();

    scheduleMovieSyncJob();

    // Booking Expiry Cron
    bookingExpiryJob();

    // Abandoned Booking Reminder Cron
    abandonedBookingReminderJob();

    return syncAllMoviesFromTmdb().catch((error) => {
      console.error("Initial TMDB sync failed:", error.message);
    });
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
