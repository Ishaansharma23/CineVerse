const express = require("express");
const { getPricing, updatePricing } = require("../controllers/pricingController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getPricing);
router.put("/", protect, authorizeRoles("admin"), updatePricing);

module.exports = router;
