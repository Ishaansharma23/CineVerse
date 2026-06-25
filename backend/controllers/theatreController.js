const Theatre = require('../models/Theatre');

// ab create theatre function
const createTheatre = async (req , res) => {
    try {
    const { name, description, city, address, amenities } = req.body;

    if( !name || !city || !address ){
        return res.status(400).json({
            success : false,
            message : "Please provide name , city, and address",
        });
    }
 // create theatre logic
    const theatre = await Theatre.create({
        name , description , city , address , amenities , owner: req.user._id, // "Jo owner login hai, usi ke naam par theatre save karo."
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

}

module.exports = { createTheatre };