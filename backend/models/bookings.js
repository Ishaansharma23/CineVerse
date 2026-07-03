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
    // Razorpay order id
    orderId: {
      type: String,
      default: null,
    },

    // Razorpay payment signature
    paymentSignature: {
      type: String,
      default: null,
    },

    // Razorpay refund id
    refundId: {
      type: String,
      default: null,
    },

    // User ko kitna refund mila
    refundAmount: {
      type: Number,
      default: 0,
    },

    // Refund status
    refundStatus: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: null,
    },

    // Booking kab cancel hui
    cancelledAt: {
      type: Date,
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
      enum: ["pending", "booked", "cancelled", "expired", "failed"],
      default: "pending",
    },

    // Seat lock expire kab hoga (Redis flow me use hoga)
    bookingExpiresAt: {
      type: Date,
      default: null,
    },

    // Ticket QR Image (Base64)
    ticketQr: {
      type: String,
      default: null,
    },

    // Theatre me entry ho chuki ya nahi
    checkedIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
