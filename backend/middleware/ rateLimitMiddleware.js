const rateLimit = require("express-rate-limit");

/*
// Common API Rate Limiter
const apiLimiter = rateLimit({

  // Kitne time ke liye requests count hongi
  // 15 minutes
  windowMs: 15 * 60 * 1000,

  // Ek IP maximum kitni request kar sakta hai
  // 15 minute me sirf 100 requests allow hongi
  max: 100,

  // Standard RateLimit headers response me bhejega

// RateLimit-Limit: 100
// RateLimit-Remaining: 73
// RateLimit-Reset: 320
  //
  // Client ko pata chal jata hai
  // kitni requests bachi hain
  standardHeaders: true, // Ye server aur frontend ke beech information share karta hai.

  // Purane Express headers disable kar do
  //
  // X-RateLimit-Limit
  // X-RateLimit-Remaining
  // X-RateLimit-Reset
  //
  // Hum new standard use kar rahe hain.
  legacyHeaders: false,

  // Agar limit exceed ho gayi to ye response jayega
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },

});

// Login API ke liye alag limiter
const authLimiter = rateLimit({

  // 15 minute ka time window
  windowMs: 15 * 60 * 1000,

  // Sirf 5 login attempts allow
  max: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },

});

// Payment APIs ke liye limiter
const paymentLimiter = rateLimit({

  // 15 minute
  windowMs: 15 * 60 * 1000,

  // Payment APIs par 20 requests allow
  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many payment requests.",
  },

});
*/

// No-op Pass-through implementations to bypass 429 errors
const apiLimiter = (req, res, next) => next();
const authLimiter = (req, res, next) => next();
const paymentLimiter = (req, res, next) => next();

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
};