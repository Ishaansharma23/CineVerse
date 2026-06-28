const express = require("express");

const {
  createShow,
  getMyShows,
  getShowById,
  updateShow,
  deleteShow,
} = require("../controllers/showController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Create show
router.post("/", protect, authorizeRoles("owner"), createShow);

// Logged-in owner ke theatre ke saare shows
router.get("/my/:theatreId", protect, authorizeRoles("owner"), getMyShows);

// Single show details
router.get("/:id", getShowById);

// Update show
router.put("/:id", protect, authorizeRoles("owner"), updateShow);

// Cancel show (Soft Delete)
router.delete("/:id", protect, authorizeRoles("owner"), deleteShow);

module.exports = router;
