const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getOffers,
  createOffer,
  deleteOffer,
  validateOfferCode,
} = require("../controllers/offerController");

const router = express.Router();

router.get("/", getOffers);
router.post("/validate", validateOfferCode);
router.post("/", protect, authorizeRoles("admin"), createOffer);
router.delete("/:id", protect, authorizeRoles("admin"), deleteOffer);

module.exports = router;
