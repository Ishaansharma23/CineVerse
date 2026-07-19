const Theatre = require('../models/Theatre');
const User = require('../models/User');
const Booking = require('../models/bookings');
const Movie = require('../models/Movie');
const Screen = require('../models/Screen');
const Show = require('../models/Show');

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
        console.log("=== getMyTheatres debug ===");
        console.log("Logged-in user id:", req.user?._id);
        const theatres = await Theatre.find({
            owner: req.user._id,
        });
        console.log("Query returned theatres count:", theatres.length);
        console.log("Theatres data:", theatres);

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
// Future me isko aise kar sakta hai:

// const theatre = await Theatre.findOne({
//     _id: theatreId,
//     isActive: true,
// });

// Taaki deleted (inactive) theatre bhi na dikhe.
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

// ab approve krna hai theatre ko joki sirf admin hi kr skta hai usi k liye hai ye logic
const approveTheatre = async (req , res) => {
    const theatreId = req.params.id;

    try{
        // pehle theatre ko find krenge
        const theatre = await Theatre.findById(theatreId);
        if(!theatre){
            return res.status(404).json({
                success: false,
                message: "Theatre not found",
            });
        }

        // Check if theatre is already approved
        if (theatre.status === "approved") {
            return res.status(400).json({
                success: false,
                message: "Theatre is already approved",
            });
        }

        // ab approve krenge 
        theatre.status = "approved";

        // updated theatre ko database me save kar do
        await theatre.save();

        res.status(200).json({
            success: true,
            message: "Theatre approved successfully",
            theatre,
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

const getPendingTheatres = async (req, res) => {
    try {
        const theatres = await Theatre.find({
            status: "pending",
            isActive: true,
        }).populate("owner", "name email");

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

const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalOwners = await User.countDocuments({ role: "owner" });
        const totalMovies = await Movie.countDocuments();
        const totalTheatres = await Theatre.countDocuments();
        const totalScreens = await Screen.countDocuments();
        const totalShows = await Show.countDocuments();
        const pendingTheatreApprovals = await Theatre.countDocuments({ status: "pending" });

        const allBookings = await Booking.find({ bookingStatus: "booked" });
        const totalRevenue = allBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalBookingsCount = allBookings.length;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayBookings = await Booking.find({ bookingStatus: "booked", createdAt: { $gte: todayStart } });
        const todayRevenue = todayBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const todayBookingsCount = todayBookings.length;

        const refundBookings = await Booking.find({ bookingStatus: "cancelled" });
        const refundCount = refundBookings.length;
        const totalRefundedAmount = refundBookings.reduce((sum, b) => sum + (b.refundAmount || 0), 0);
        const profit = totalRevenue - totalRefundedAmount;

        const recentBookings = await Booking.find({ bookingStatus: "booked" })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("user", "name email")
            .populate({
                path: "show",
                populate: [
                    { path: "movie", select: "title" },
                    { path: "screen", populate: { path: "theatre", select: "name" } }
                ]
            });

        const recentUsers = await User.find({ role: "user" }).sort({ createdAt: -1 }).limit(5);
        const recentOwners = await User.find({ role: "owner" }).sort({ createdAt: -1 }).limit(5);

        const dailyStats = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            dailyStats[dateStr] = { date: dateStr, bookings: 0, revenue: 0 };
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const graphBookings = await Booking.find({ bookingStatus: "booked", createdAt: { $gte: sevenDaysAgo } });

        graphBookings.forEach(b => {
            const dateStr = new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            if (dailyStats[dateStr]) {
                dailyStats[dateStr].bookings += 1;
                dailyStats[dateStr].revenue += b.totalAmount;
            }
        });
        const graphData = Object.values(dailyStats).reverse();

        const bookingsForTop = await Booking.find({ bookingStatus: "booked" })
            .populate({
                path: "show",
                populate: [
                    { path: "movie", select: "title" },
                    { path: "screen", populate: { path: "theatre", select: "name" } }
                ]
            });

        const movieMap = {};
        const theatreMap = {};

        bookingsForTop.forEach(b => {
            if (b.show && b.show.movie) {
                const movieTitle = b.show.movie.title;
                movieMap[movieTitle] = (movieMap[movieTitle] || 0) + b.totalAmount;
            }
            if (b.show && b.show.screen && b.show.screen.theatre) {
                const theatreName = b.show.screen.theatre.name;
                theatreMap[theatreName] = (theatreMap[theatreName] || 0) + b.totalAmount;
            }
        });

        const topMovies = Object.entries(movieMap)
            .map(([title, revenue]) => ({ title, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const topTheatres = Object.entries(theatreMap)
            .map(([name, revenue]) => ({ name, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalOwners,
                totalMovies,
                totalTheatres,
                totalScreens,
                totalShows,
                pendingTheatreApprovals,
                totalRevenue,
                totalBookings: totalBookingsCount,
                todayRevenue,
                todayBookings: todayBookingsCount,
                refundCount,
                totalRefundedAmount,
                profit,
                recentBookings,
                recentUsers,
                recentOwners,
                graphData,
                topMovies,
                topTheatres,
            }
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
    approveTheatre,
    getPendingTheatres,
    getAdminStats,
};