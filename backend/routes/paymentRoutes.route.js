const express = require("express");
const {
  createOrder,
  verifyPayment,
  razorpayWebhook
} = require("../controllers/paymentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// razorpay order create
router.post("/create-order", protect, authorizeRoles("user"), createOrder);

// verify payment
router.post("/verify-payment", protect, authorizeRoles("user"), verifyPayment);

// razorpay webhook 
router.post("/webhook", razorpayWebhook);

module.exports = router;
