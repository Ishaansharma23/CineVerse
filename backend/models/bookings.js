const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Kis user ne booking ki
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Kis show ki booking hai
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    // Kaunsi seats book hui
    seats: {
      type: [String],
      required: true,
    },

    // Total amount
    totalAmount: {
      type: Number,
      required: true,
    },

    // Payment gateway se payment id aayegi (Razorpay)
    paymentId: {
      type: String,
      default: null,
    },

    // Har booking ka unique booking id
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },

    // Payment ka status
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // Booking ka status
    bookingStatus: {
      type: String,
      enum: ["pending", "booked", "cancelled", "expired"],
      default: "pending",
    },
    
    // Seat lock expire kab hoga (Redis flow me use hoga)
    bookingExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
