const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getSeatLayout,
} = require("../controllers/bookingController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// User new booking create karega
router.post("/", protect, authorizeRoles("user"), createBooking);

// Logged-in user ki saari bookings
router.get("/my", protect, authorizeRoles("user"), getMyBookings);

// Kisi show ka seat layout (Booked + Locked Seats)
router.get("/show/:showId/seats", getSeatLayout);

// Single booking ki details
router.get("/:id", protect, authorizeRoles("user"), getBookingById);

// Booking cancel karna
router.put("/cancel/:id", protect, authorizeRoles("user"), cancelBooking);

module.exports = router;
