const Proposal = require("../models/Proposal");

// @desc    Submit a show proposal
// @route   POST /api/proposals
// @access  Public
const submitProposal = async (req, res) => {
  try {
    const { name, email, showName, category, city, expectedPrice, message } = req.body;

    if (!name || !email || !showName || !category || !city || !expectedPrice) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const proposal = await Proposal.create({
      name,
      email,
      showName,
      category,
      city,
      expectedPrice,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Show proposal submitted successfully!",
      proposal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit show proposal.",
    });
  }
};

// @desc    Get all show proposals
// @route   GET /api/proposals
// @access  Private/Admin,Owner
const getAllProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      proposals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve proposals.",
    });
  }
};

// @desc    Update show proposal status
// @route   PUT /api/proposals/:id/status
// @access  Private/Admin,Owner
const updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal status.",
      });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found.",
      });
    }

    proposal.status = status;
    await proposal.save();

    res.json({
      success: true,
      message: `Proposal successfully ${status}!`,
      proposal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update proposal status.",
    });
  }
};

module.exports = {
  submitProposal,
  getAllProposals,
  updateProposalStatus,
};
