const Theatre = require('../models/Theatre');

// Create Theatre
const createTheatre = async (req, res) => {
    try {
        const { name, description, city, address, amenities } = req.body;

        if (!name || !city || !address) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, city, and address",
            });
        }

        // Create theatre
        const theatre = await Theatre.create({
            name,
            description,
            city,
            address,
            amenities,
            owner: req.user._id, // Jo owner login hai, usi ke naam par theatre save karo.
        });

        // Success Response
        res.status(201).json({
            success: true,
            message: "Theatre created successfully",
            theatre,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get all theatres of logged-in owner
const getMyTheatres = async (req, res) => {
    try {
        const theatres = await Theatre.find({
            owner: req.user._id,
        });

        res.status(200).json({
            success: true,
            theatres,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createTheatre,
    getMyTheatres,
};