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

//  bs ye backend s fetch krerga data ya theatre jo approved hai ststus uska or active hai 
const getAllTheatres = async (req , res) => {
    try{

        const theatres = await Theatre.find({
            status : "approved",
            isActive : true,
        });

        res.status(200).json({
            success: true,
            theatres, // frontend ko ye data bhejna hai jo theatre approved hai or active hai
        });

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
} 

// ab get theatre by id
const getTheatreById = async (req , res) => {
    const theatreId = req.params.id; // frontend se id mil rhi hai url se
    try{
        const theatre = await Theatre.findById(theatreId);
        if(!theatre){
            return res.status(404).json({
                success: false,
                message: "Theatre not found",
            });
        }

        res.status(200).json({
            success: true,
            theatre,
        });
    }catch(error){ 
        res.status(500).json({
            success: false,
            message: error.message,
        }); 
    }
}

// ye b use kr skyte update krne k liye neche wala b wo optimzed hai as req km jari db mai queries ki

// const updateTheatre = async (req , res) => {
//     // pehle id chahiye ki konse theatre m change krna hai owner n 
//     const theatreId = req.params.id;
//     try{
//         const theatre = await Theatre.findById(theatreId);
//         if(!theatre){
//             return res.status(404).json({
//                 success: false,
//                 message: "Theatre not found",
//             });
//         }

//             // check if the logged-in user is the owner of the theatre
//             // as mongodb object id hai toh usko string m convert krke compare krna hoga, kyuki wo as a string nahi hoti 
//             // ObjectId("685a7d9f3b2c4d5e6f7a8b9c") -> obj hai not a string 
//             if(theatre.owner.toString() !== req.user._id.toString()){
//                 return res.status(403).json({
//                     success: false,
//                     message: "You are not authorized to update this theatre",
//                 });
//             }

//             // update theatre details , req.body m jo bhi data bhejega frontend use lekr update krdo iss theatreId p 
//             const updatedTheatre = await Theatre.findByIdAndUpdate(theatreId, req.body, { new: true }); // new: true => updated theatre ka data return krta frontend p  
//             // nahi use krenge new true to fir wo old data hi bhejega 

//         res.status(200).json({
//             success: true,
//             message: "Theatre updated successfully",
//             theatre: updatedTheatre,
//         }); 
//     }catch(error){
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }   
// }

const updateTheatre = async (req, res) => {
    // pehle id chahiye ki konse theatre m change krna hai owner n
    const theatreId = req.params.id;

    try {

        const theatre = await Theatre.findById(theatreId);

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found",
            });
        }

        // check if the logged-in user is the owner of the theatre
        // as mongodb object id hai toh usko string m convert krke compare krna hoga, kyuki wo as a string nahi hoti
        // ObjectId("685a7d9f3b2c4d5e6f7a8b9c") -> object hai, string nahi
        if (theatre.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this theatre",
            });
        }

        // req.body se jo values aayi hain unhi ko update karo,
        // agar koi field nahi aayi to purani value hi rehne do

        theatre.name = req.body.name || theatre.name;
        theatre.description = req.body.description || theatre.description;
        theatre.city = req.body.city || theatre.city;
        theatre.address = req.body.address || theatre.address;
        theatre.amenities = req.body.amenities || theatre.amenities;

        // updated theatre ko database me save kar do
        const updatedTheatre = await theatre.save();

        res.status(200).json({
            success: true,
            message: "Theatre updated successfully",
            theatre: updatedTheatre,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// del krna theatre ko
const deleteTheatre = async (req, res) => {

    // konse theatre ko delete krna hai uski id frontend se aayegi
    const theatreId = req.params.id;

    try {

        const theatre = await Theatre.findById(theatreId);

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found",
            });
        }

        // check if the logged-in user is the owner of the theatre
        // taki koi dusra owner kisi aur ka theatre delete na kar paye
        if (theatre.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this theatre",
            });
        }

        // Permanent delete nahi kar rahe.
        // Sirf theatre ko inactive kar rahe hain (Soft Delete).
        // Isse future bookings, reports aur records safe rehte hain.
        // Frontend pe ye theatre nahi dikhega kyuki getAllTheatres()
        // sirf isActive: true wale theatres fetch karta hai.

        theatre.isActive = false;

        // updated theatre ko database me save kar do
        await theatre.save();

        res.status(200).json({
            success: true,
            message: "Theatre deleted successfully",
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
    getAllTheatres,
    getTheatreById,
    updateTheatre,
    deleteTheatre,
};