const express = require('express');

const {
  createTheatre,
  getAllTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
  approveTheatre,
  getMyTheatres,
} = require("../controllers/theatreController");


const {protect , authorizeRoles} = require("../middleware/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/", getAllTheatres);
router.get("/:id", getTheatreById);

// owner routes , protect -=> check user logged in hai ya nhi , authorizeRoles("owner") => check user role owner hai ya nhi
outer.get("/my", protect , authorizeRoles("owner") , getMyTheatres); // owner apne theaters dekh skta h
router.post("/" , protect , authorizeRoles("owner") , createTheatre); // owner ko hi acess milega bs
router.put("/:id" , protect , authorizeRoles("owner") , updateTheatre   ); // owner ko hi acess milega bs
router.delete("/:id" , protect , authorizeRoles("owner") , deleteTheatre);

// admin routes
// PATCH use kiya hai kyuki hum sirf theatre ka status
// (pending -> approved) update kr rhe hain, naya resource create nhi kr rhe
router.patch("/approve/:id" , protect , authorizeRoles("admin") , approveTheatre); // admin ko hi acess milega bs

module.exports = router;