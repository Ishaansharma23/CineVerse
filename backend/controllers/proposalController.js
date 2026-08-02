const Proposal = require("../models/Proposal");

const submitProposal = async (req, res) => {
  try {
    const { name, email, showName, category, city, expectedPrice, message, theatreId, mediaLink } = req.body;

    if (!name || !email || !showName || !category || !city || !expectedPrice || !theatreId || !mediaLink) {
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
      theatreId,
      mediaLink,
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

const getAllProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find().populate("theatreId", "name city address").sort({ createdAt: -1 });
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


const updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal status. Must be approved or rejected.",
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

const Theatre = require("../models/Theatre");


const getOwnerProposals = async (req, res) => {
  try {
    // Find all theatres owned by this user
    const theatres = await Theatre.find({ owner: req.user._id });
    const theatreIds = theatres.map((t) => t._id);

    // Find proposals for these theatres
    const proposals = await Proposal.find({
      theatreId: { $in: theatreIds },
    }).populate("theatreId", "name city address").sort({ createdAt: -1 });

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


const ownerApproveProposal = async (req, res) => {
  try {
    const { status } = req.body;
    // Owner can only push to pending_admin or reject
    if (!["pending_admin", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found.",
      });
    }

    // verify the owner owns the theatre for this proposal
    const theatre = await Theatre.findById(proposal.theatreId);
    if (!theatre || theatre.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to approve this proposal.",
      });
    }

    proposal.status = status;
    await proposal.save();

    res.json({
      success: true,
      message: `Proposal successfully updated to ${status}!`,
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
  getOwnerProposals,
  ownerApproveProposal,
};
