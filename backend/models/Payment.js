const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "captured", "failed", "refunded"],
      default: "pending",
    },
    refunds: [
      {
        refundId: { type: String, required: true },
        amount: { type: Number, required: true },
        status: { type: String, default: "processed" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    rawWebhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
