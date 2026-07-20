const PricingConfig = require("../models/PricingConfig");
const { getActivePricing } = require("../services/pricingService");

// GET /api/admin/pricing - View currently active configuration settings
const getPricing = async (req, res) => {
  try {
    const config = await getActivePricing();
    res.status(200).json({
      success: true,
      gstRate: config.gstRate,
      convenienceFee: config.convenienceFee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/admin/pricing - Save updated pricing settings (creates a new active document, deactivates older ones)
const updatePricing = async (req, res) => {
  try {
    const { gstRate, convenienceFee } = req.body;

    if (gstRate === undefined || convenienceFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide both gstRate and convenienceFee parameters.",
      });
    }

    const gstNum = Number(gstRate);
    const feeNum = Number(convenienceFee);

    if (isNaN(gstNum) || gstNum < 0 || gstNum > 100) {
      return res.status(400).json({
        success: false,
        message: "GST rate must be a valid percentage between 0 and 100.",
      });
    }

    if (isNaN(feeNum) || feeNum < 0) {
      return res.status(400).json({
        success: false,
        message: "Convenience fee must be a non-negative number.",
      });
    }

    // Deactivate all existing configurations
    await PricingConfig.updateMany({ isActive: true }, { isActive: false });

    // Create a brand new active configuration
    const newConfig = await PricingConfig.create({
      gstRate: gstNum,
      convenienceFee: feeNum,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: "Pricing settings updated successfully.",
      gstRate: newConfig.gstRate,
      convenienceFee: newConfig.convenienceFee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPricing,
  updatePricing,
};
