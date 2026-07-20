const mongoose = require("mongoose");

const pricingConfigSchema = new mongoose.Schema(
  {
    gstRate: {
      type: Number,
      required: true,
      default: 18,
    },
    convenienceFee: {
      type: Number,
      required: true,
      default: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PricingConfig", pricingConfigSchema);
