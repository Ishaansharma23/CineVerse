const Offer = require("../models/Offer");

// @desc    Get active promo offers
// @route   GET /api/offers
// @access  Public
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve offers.",
    });
  }
};

// @desc    Create new offer code
// @route   POST /api/offers
// @access  Private/Admin
const createOffer = async (req, res) => {
  try {
    const { title, code, description, discountType, discountValue, minPurchase } = req.body;

    if (!title || !code || !description || !discountValue) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const uppercaseCode = code.toUpperCase();
    const existingOffer = await Offer.findOne({ code: uppercaseCode });
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: "An offer with this code already exists.",
      });
    }

    const offer = await Offer.create({
      title,
      code: uppercaseCode,
      description,
      discountType: discountType || "flat",
      discountValue,
      minPurchase: minPurchase || 0,
    });

    res.status(201).json({
      success: true,
      offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create offer.",
    });
  }
};

// @desc    Delete/Deactivate promo offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer code not found.",
      });
    }

    await Offer.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Offer deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete offer.",
    });
  }
};

// @desc    Validate and calculate promo code discount
// @route   POST /api/offers/validate
// @access  Public
const validateOfferCode = async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Code and booking amount are required.",
      });
    }

    const offer = await Offer.findOne({ code: code.toUpperCase(), isActive: true });
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired promo code.",
      });
    }

    if (amount < offer.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `This promo requires a minimum purchase amount of ₹${offer.minPurchase}.`,
      });
    }

    let discount = 0;
    if (offer.discountType === "flat") {
      discount = offer.discountValue;
    } else if (offer.discountType === "percentage") {
      discount = Math.round((amount * offer.discountValue) / 100);
    }

    // Discount cannot exceed the actual amount
    const finalDiscount = Math.min(discount, amount);
    const newAmount = amount - finalDiscount;

    res.json({
      success: true,
      message: "Promo code successfully applied!",
      offer: {
        code: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
      },
      discountAmount: finalDiscount,
      newAmount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to validate promo code.",
    });
  }
};

module.exports = {
  getOffers,
  createOffer,
  deleteOffer,
  validateOfferCode,
};
