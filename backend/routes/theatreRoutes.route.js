const express = require('express');

const {
  createTheatre,
  getAllTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
  approveTheatre,
  getMyTheatres,
  getPendingTheatres,
  getAdminStats,
} = require("../controllers/theatreController");


const {protect , authorizeRoles} = require("../middleware/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/", getAllTheatres);

// owner routes , protect -=> check user logged in hai ya nhi , authorizeRoles("owner") => check user role owner hai ya nhi
router.get("/my", protect , authorizeRoles("owner") , getMyTheatres); // owner apne theaters dekh skta h
router.post("/" , protect , authorizeRoles("owner") , createTheatre); // owner ko hi acess milega bs

// admin routes
// GET pending theatres
router.get("/admin/pending", protect, authorizeRoles("admin"), getPendingTheatres);
// GET admin stats dashboard
router.get("/admin/stats", protect, authorizeRoles("admin"), getAdminStats);
// PATCH use kiya hai kyuki hum sirf theatre ka status
// (pending -> approved) update kr rhe hain, naya resource create nhi kr rhe
router.patch("/approve/:id" , protect , authorizeRoles("admin") , approveTheatre); // admin ko hi acess milega bs

// Wildcard parameter routes
router.get("/:id", getTheatreById);
router.put("/:id" , protect , authorizeRoles("owner") , updateTheatre   ); // owner ko hi acess milega bs
router.delete("/:id" , protect , authorizeRoles("owner") , deleteTheatre);

module.exports = router;