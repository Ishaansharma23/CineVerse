const express = require("express");
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// razorpay order create 
router.post("/create-order" , protect , authorizeRoles("user") , createOrder);

// verify payment
router.post("/verify-payment" , protect , authorizeRoles("user") , verifyPayment);

module.exports = router;