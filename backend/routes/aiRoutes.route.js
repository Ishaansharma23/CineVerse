const express = require("express");
const { handleChatSession } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/chat", protect, handleChatSession);

module.exports = router;
