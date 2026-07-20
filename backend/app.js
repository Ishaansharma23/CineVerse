const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes.route");
const movieRoutes = require("./routes/movieRoutes.route");
const theatreRoutes = require("./routes/theatreRoutes.route");
const bookingRoutes = require("./routes/bookingRoutes.route");
const showRoutes = require("./routes/showRoutes.route");
const screenRoutes = require("./routes/screenRoutes.route");
const paymentRoutes = require("./routes/paymentRoutes.route");
const offerRoutes = require("./routes/offerRoutes.route");
const proposalRoutes = require("./routes/proposalRoutes.route");
const aiRoutes = require("./routes/aiRoutes.route");
const {
  apiLimiter,
  authLimiter,
  paymentLimiter,
} = require("./middleware/ rateLimitMiddleware");

const app = express();

//  Ye line = (Webhook ke liye raw body)
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

app.use(cookieParser());
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies to be sent with requests
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CineVerse backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/movies", apiLimiter, movieRoutes);
// theatre routes
app.use("/api/theatres", apiLimiter, theatreRoutes);
// Booking routes
app.use("/api/bookings", apiLimiter, bookingRoutes);
// show
app.use("/api/shows", apiLimiter, showRoutes);
// screen
app.use("/api/screens", apiLimiter, screenRoutes);
// payment
app.use("/api/payment", paymentLimiter, paymentRoutes);
// dynamic offers and proposals
app.use("/api/offers", apiLimiter, offerRoutes);
app.use("/api/proposals", apiLimiter, proposalRoutes);
app.use("/api/ai", apiLimiter, aiRoutes);

module.exports = app;
