const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes.route');
const movieRoutes = require('./routes/movieRoutes.route');
const theatreRoutes = require('./routes/theatreRoutes.route')
const bookingRoutes = require("./routes/bookingRoutes.route");
const showRoutes = require("./routes/showRoutes.route");


const app = express();

app.use(cookieParser());
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Allow cookies to be sent with requests
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CineVerse backend is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
// theatre routes 
app.use("/api/theatres", theatreRoutes);
// Booking routes
app.use("/api/bookings", bookingRoutes);
// show routes
app.use("/api/shows", showRoutes);
module.exports = app;