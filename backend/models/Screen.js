const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema(
  {
    // Screen name/number (Audi 1, Screen 2, IMAX Hall)
    screenNumber: {
      type: String,
      required: [true, "Screen number is required"],
      trim: true,
    },

    // Reference to the theatre in which this screen exists
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theatre",
      required: true,
      index: true, 
    },

    // Type of screen
    screenType: {
      type: String,
      enum: ["2D", "3D", "IMAX", "4DX"],
      default: "2D",
    },

    // Total number of rows (A, B, C, D...)
    totalRows: {
      type: Number,
      required: true,
      min: 1,
    },

    // Number of seats in each row
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1,
    },

    // Total seats in the screen
    // (Can also be calculated using totalRows * seatsPerRow)
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    // Permanent seat layout of this screen
    // Booking status will NOT be stored here.
    seatLayout: [
      {
        // Row name (A, B, C...)
        row: {
          type: String,
          required: true,
        },

        // Seat number within that row
        seatNumber: {
          type: Number,
          required: true,
        },

        // Complete seat label (A1, A2, B5...)
        seatLabel: {
          type: String,
          required: true,
        },

        // Seat category
        seatType: {
          type: String,
          enum: ["Regular", "Premium", "Recliner"],
          default: "Regular",
        },
      },
    ],

    // Extra facilities available in this screen
    // Example: Dolby Atmos, Recliner, Wheelchair Accessible
    features: [
      {
        type: String,
      },
    ],

    // Whether this screen is active or under maintenance
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

// Automatically calculate total seats before saving
screenSchema.pre("save", function (next) {
  this.totalSeats = this.totalRows * this.seatsPerRow;
  next();
});

module.exports = mongoose.model("Screen", screenSchema);