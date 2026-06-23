const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    overview: {
      type: String,
      default: '',
    },
    posterPath: {
      type: String,
      default: '',
    },
    backdropPath: {
      type: String,
      default: '',
    },
    posterUrl: {
      type: String,
      default: '',
    },
    backdropUrl: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
    genres: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      default: '',
    },
    releaseDate: {
      type: Date,
      default: null,
    },
    runtime: {
      type: Number,
      default: null,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// popularity -> jiski ratings ya popularity/trending wgera jyada uska -1 yani descendning m ayega , 1 = ascending
movieSchema.index({ categories: 1, popularity: -1 });

module.exports = mongoose.model('Movie', movieSchema);