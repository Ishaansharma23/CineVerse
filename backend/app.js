const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes.route');
const movieRoutes = require('./routes/movieRoutes.route');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CineVerse backend is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);

module.exports = app;