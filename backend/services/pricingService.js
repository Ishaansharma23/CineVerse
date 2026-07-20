const PricingConfig = require("../models/PricingConfig");

// Seed default pricing config if none exists or none is active
const seedPricingConfig = async () => {
  try {
    const activeConfig = await PricingConfig.findOne({ isActive: true });
    if (!activeConfig) {
      const totalConfigs = await PricingConfig.countDocuments();
      if (totalConfigs === 0) {
        await PricingConfig.create({
          gstRate: 18,
          convenienceFee: 30,
          isActive: true,
        });
        console.log("PricingConfig seeded successfully with default values (18% GST, ₹30 Convenience Fee).");
      } else {
        const firstConfig = await PricingConfig.findOne();
        firstConfig.isActive = true;
        await firstConfig.save();
        console.log("No active configuration was found. Marked the first existing PricingConfig as active.");
      }
    }
  } catch (error) {
    console.error("Error seeding PricingConfig:", error.message);
  }
};

// Retrieve the single active pricing configuration
const getActivePricing = async () => {
  const config = await PricingConfig.findOne({ isActive: true });
  if (!config) {
    throw new Error("No active pricing configuration found on the server.");
  }
  return config;
};

// Calculate pricing details dynamically
const calculateBookingPricing = async (seatCount, ticketPrice) => {
  const pricing = await getActivePricing();
  const subtotal = seatCount * ticketPrice;
  const convenienceFee = pricing.convenienceFee * seatCount;
  const gst = Math.round((pricing.gstRate / 100) * (subtotal + convenienceFee));
  const totalAmount = subtotal + convenienceFee + gst;
  return {
    subtotal,
    convenienceFee,
    gst,
    totalAmount,
  };
};

module.exports = {
  seedPricingConfig,
  getActivePricing,
  calculateBookingPricing,
};
