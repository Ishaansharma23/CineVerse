const express = require('express');

const {
  createTheatre,
  getAllTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
  approveTheatre,
} = require("../controllers/theatreController");


const {protect , authorizeRoles} = require("../middleware/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/", getAllTheatres);
router.get("/:id", getTheatreById);

// owner routes
router.post("/" , protect , authorizeRoles("owner") , createTheatre); // owner ko hi acess milega bs
router.put("/:id" , protect , authorizeRoles("owner") , updateTheatre   ); // owner ko hi acess milega bs
router.delete("/:id" , protect , authorizeRoles("owner") , deleteTheatre);

// admin routes
router.post("/approve/:id" , protect , authorizeRoles("admin") , approveTheatre); // admin ko hi acess milega bs

module.exports = router;