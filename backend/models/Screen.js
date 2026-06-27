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
      index: true, // Theatre ki screens jaldi fetch hongi
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
    // Automatically calculate using totalRows * seatsPerRow
    // Owner ko ye manually bhejne ki zarurat nahi hai.
    totalSeats: {
      type: Number,
      default: 0,
    },

    // Permanent seat layout of this screen
    // Booking status yaha store nahi hoga.
    // Sirf screen ka permanent layout hoga.
    seatLayout: [
      {
        // Row name (A, B, C...)
        row: {
          type: String,
          required: true,
        },

        // Ek row ke andar sari seats hongi
        seats: [
          {
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
      },
    ],

    // Extra facilities available in this screen
    // Example: Dolby Atmos, Recliner, Wheelchair Accessible
    features: [
      {
        type: String,
        trim: true,
      },
    ],

    // Whether this screen is active 
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

// Automatically calculate total seats
// Automatically generate seat layout before saving
screenSchema.pre("save", function (next) {

  // Automatically calculate total seats
  this.totalSeats = this.totalRows * this.seatsPerRow;

  // Agar seatLayout already bana hua hai
  // to dubara generate mat karo
  if (this.seatLayout.length > 0) {
    return next();
  }

  const layout = [];

  // Rows generate karna (A, B, C...)
  for (let i = 0; i < this.totalRows; i++) {

    const rowLetter = String.fromCharCode(65 + i);

    const seats = [];

    // Har row ki seats generate karna
    for (let j = 1; j <= this.seatsPerRow; j++) {

      seats.push({
        seatNumber: j,
        seatLabel: `${rowLetter}${j}`,
        seatType: "Regular",
      });

    }

    layout.push({
      row: rowLetter,
      seats,
    });

  }

  // seatlayout wala part database me save hoga
  this.seatLayout = layout;

  next();

});

module.exports = mongoose.model("Screen", screenSchema);