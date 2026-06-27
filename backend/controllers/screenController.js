const Screen = require("../models/Screen");
const Theatre = require("../models/Theatre");


const createScreen = async (req , res) => {
    try {
        const { theatreId , screenNumber , screenType , totalRows , seatsPerRow , features ,} = req.body;

        // Required fields check karo
        if (!theatreId || !screenNumber || !totalRows || !seatsPerRow) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        // ab theatre find
        const theatre = await Theatre.findById(theatreId);

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found",
            });
        }

        // Check karo ki logged-in owner isi theatre ka owner hai ya nahi
        // Taki koi dusra owner kisi aur ke theatre me screen create na kar sake
        if (theatre.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to add screen in this theatre",
            });
        }

        // Nayi Screen create karo
        // totalSeats aur seatLayout automatically middleware generate karega
        const screen = await Screen.create({
            theatre: theatreId,
            screenNumber,
            screenType,
            totalRows,
            seatsPerRow,
            features,
        });

        // Theatre ke screens[] array me nayi Screen ki id add karo
        theatre.screens.push(screen._id);

        // Updated theatre database me save karo
        await theatre.save();

        res.status(201).json({
            success: true,
            message: "Screen created successfully",
            screen,
        });

    } catch (error) {
        console.log("Error creating screen:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

const getMyScreens = async (req , res) => {
    try {

        // Route se theatre ki id lo
        const theatreId = req.params.theatreId;

        // Pehle theatre find karo
        const theatre = await Theatre.findById(theatreId);

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found",
            });
        }

        // Check karo ki logged-in owner isi theatre ka owner hai ya nahi
        // Taki koi dusra owner kisi aur ke theatre ki screens na dekh sake
        if (theatre.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view these screens",
            });
        }

        // Ab us theatre ki saari active screens fetch karo
        const screens = await Screen.find({
            theatre: theatreId,
            isActive: true,
        });

        res.status(200).json({
            success: true,
            message: "My screens fetched successfully",
            // Is theatre ki sari screens
            screens,
        });

    } catch (error) {

        console.log("Error fetching my screens:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

const getScreenById = async (req , res) => {
    const screenId = req.params.id;
    try {   
        // populate isliye kyuki theatre id milegi bs schema m frontend pr lekin we want name city bhi mile toh added 
        const screen = await Screen.findById(screenId).populate("theatre", "name city");
        if(!screen){
            return res.status(404).json({
                success: false,
                message: "Screen not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Screen fetched successfully",
            screen,
        });
    } catch (error) {
        console.log("Error fetching screen:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

const updateScreen = async (req, res) => {

    // Kon si screen update karni hai
    const screenId = req.params.id;

    try {

        // Pehle screen find karo
        const screen = await Screen.findById(screenId);

        if (!screen) {
            return res.status(404).json({
                success: false,
                message: "Screen not found",
            });
        }

        // Screen ke through theatre find karo
        // Screen schema me theatre ki ObjectId already stored hai
        const theatre = await Theatre.findById(screen.theatre);

        if (!theatre) {
            return res.status(404).json({
                success: false,
                message: "Theatre not found",
            });
        }

        // Check karo ki logged-in owner isi theatre ka owner hai ya nahi
        // Taki koi dusra owner kisi aur ki screen update na kar sake
        if (theatre.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this screen",
            });
        }

        const {
            screenNumber,
            screenType,
            totalRows,
            seatsPerRow,
            features,
        } = req.body;

        // Jo fields frontend se aayi hain sirf unhi ko update karo
        screen.screenNumber = screenNumber || screen.screenNumber;
        screen.screenType = screenType || screen.screenType;
        screen.totalRows = totalRows || screen.totalRows;
        screen.seatsPerRow = seatsPerRow || screen.seatsPerRow;
        screen.features = features || screen.features;

        // Updated screen database me save karo
        const updatedScreen = await screen.save();

        res.status(200).json({
            success: true,
            message: "Screen updated successfully",
            screen: updatedScreen,
        });

    } catch (error) {

        console.log("Error updating screen:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

const deleteScreen = async (req , res ) => {
    const screenId  = req.params.id;

    try{
        // pehle screen dhundega
        const screen = await Screen.findById(screenId);
        if(!screen){
            return res.status(404).json({
                success: false,
                message: "Screen not found",
            });
        }

        // fir screen m theatre hoga use find krenge
        const theatre = await Theatre.findById(screen.theatre);
        if(!theatre){
            return res.status(404).json({
                success: false,
                message: "Theatre not found",
            }); 
        }

        // fir check ownership
        if (theatre.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this screen",
            });
        }

        // soft delete
        screen.isActive = false;
        await screen.save();

        res.status(200).json({
            success: true,
            message: "Screen deleted successfully",
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }   
}

module.exports = {getMyScreens , createScreen , getScreenById , updateScreen , deleteScreen };