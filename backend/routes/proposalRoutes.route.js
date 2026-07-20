const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  submitProposal,
  getAllProposals,
  updateProposalStatus,
  getOwnerProposals,
  ownerApproveProposal,
} = require("../controllers/proposalController");

const router = express.Router();

router.post("/", submitProposal);
router.get("/", protect, authorizeRoles("admin"), getAllProposals);
router.get("/owner", protect, authorizeRoles("owner"), getOwnerProposals);
router.put("/:id/status", protect, authorizeRoles("admin"), updateProposalStatus);
router.put("/:id/owner-approve", protect, authorizeRoles("owner"), ownerApproveProposal);

module.exports = router;
