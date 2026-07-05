const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  submitProposal,
  getAllProposals,
  updateProposalStatus,
} = require("../controllers/proposalController");

const router = express.Router();

router.post("/", submitProposal);
router.get("/", protect, authorizeRoles("admin", "owner"), getAllProposals);
router.put("/:id/status", protect, authorizeRoles("admin", "owner"), updateProposalStatus);

module.exports = router;
