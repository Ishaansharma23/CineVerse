const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  showName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  expectedPrice: {
    type: Number,
    required: true,
  },
  theatreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theatre",
    required: true,
  },
  mediaLink: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending_owner", "pending_admin", "approved", "rejected"],
    default: "pending_owner",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Proposal", proposalSchema);
