const express = require('express');
const { createScreen, getMyScreens, getScreenById, updateScreen, deleteScreen } = require("../controllers/screenController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Create Screen, yani hall add krna jaise audi1 , audi 2 , imax 
router.post("/", protect, authorizeRoles("owner"), createScreen);

// Logged-in owner (Ek theatre ke saare screens laana.)
router.get("/my/:theatreId", protect , authorizeRoles("owner"), getMyScreens);

// single screen ki details protect isliye nahi as user click krke dekh skta screens 
router.get("/:id", getScreenById);


// Screen update karna
router.put( "/:id", protect, authorizeRoles("owner"), updateScreen);

// Soft delete screen
router.delete("/:id" , protect , authorizeRoles("owner") , deleteScreen);

module.exports = router;



