const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getSeatLayout,
  getAllBookingsAdmin,
  getBookingPdf,
  getOwnerBookings,
} = require("../controllers/bookingController");
const { verifyTicket } = require("../controllers/ticketController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:id/pdf", protect, getBookingPdf);
router.get("/owner/:theatreId", protect, authorizeRoles("owner"), getOwnerBookings);

// Theatre QR Verification
router.post("/verify", protect, authorizeRoles("owner", "admin"), verifyTicket);

// Admin all bookings monitor
router.get("/admin/all", protect, authorizeRoles("admin"), getAllBookingsAdmin);

// User new booking create karega
router.post("/", protect, authorizeRoles("user"), createBooking);

// Logged-in user ki saari bookings
router.get("/my", protect, authorizeRoles("user"), getMyBookings);

// Kisi show ka seat layout (Booked + Locked Seats), express m left to right jati calls
router.get(
  "/show/:showId/seats", // protect nahi hai as booking k tym dekhna hmne user loged in ha ya nahi seat pr click krega jab wo
  getSeatLayout
);

// Single booking ki details
router.get("/:id", protect, authorizeRoles("user"), getBookingById);

// Booking cancel karna
router.put("/cancel/:id", protect, authorizeRoles("user"), cancelBooking);

module.exports = router;
