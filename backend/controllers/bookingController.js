const Booking = require("../models/Booking");
const Show = require("../models/Show");
const {
  lockSeat,
  unlockSeat,
  getLockedSeats,
  isSeatLocked,
} = require("../services/seatLockService");

const createBooking = async (req, res) => {
  try {
    const { showId, seats } = req.body;

    // Required fields check karo
    if (!showId || !seats || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide show and seats",
      });
    }

    // Show exist karta hai ya nahi
    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Cancelled show ki booking allow nahi hogi
    if (show.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "This show is not available for booking",
      });
    }

    // Jo seats successfully lock ho gayi unhe store karenge
    const lockedSeats = [];

    // Har selected seat ko lock karne ki koshish karo
    for (const seat of seats) {
      // Redis me seat lock karo
      const lockResult = await lockSeat(showId, seat, req.user._id);

      // Agar kisi aur user ne seat lock kar rakhi hai
      if (!lockResult.success) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat} is already locked by another user`,
        });
      }

      // Successfully locked seat ko array me store karo
      lockedSeats.push(seat);
    }

    // Total amount calculate karo
    const totalAmount = seats.length * show.price;

    // Unique booking id generate karo
    const bookingId = `CV-${Date.now()}`;

    // Booking create karo
    const booking = await Booking.create({
      // Logged-in user
      user: req.user._id,

      // Kis show ki booking hai
      show: showId,

      // Selected seats
      seats,

      // Total amount
      totalAmount,

      // Booking id
      bookingId,

      // Payment abhi pending hai
      paymentStatus: "pending",

      // Booking status
      bookingStatus: "pending",

      // 5 minute baad booking expire ho jayegi agar payment nahi hui
      bookingExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.log("Error creating booking:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all bookings of logged-in user
const getMyBookings = async (req, res) => {
  try {
    // Logged-in user ki saari bookings fetch karo
    const bookings = await Booking.find({
      user: req.user._id,
    })
      // Booking ke andar show ki details lao
      .populate({
        path: "show",

        // Show ke andar movie aur screen bhi populate karo
        populate: [
          {
            path: "movie",
          },
          {
            path: "screen",
          },
        ],
      });

    res.status(200).json({
      success: true,
      message: "My bookings fetched successfully",
      bookings,
    });
  } catch (error) {
    console.log("Error fetching bookings:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single booking by id
const getBookingById = async (req, res) => {
  try {
    // URL se booking id lo
    const bookingId = req.params.id;

    // Booking find karo aur show, movie, screen ki details bhi bhejo
    const booking = await Booking.findById(bookingId).populate({
      path: "show",
      populate: [
        {
          path: "movie",
        },
        {
          path: "screen",
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check karo logged-in user isi booking ka owner hai ya nahi
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this booking",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      booking,
    });
  } catch (error) {
    console.log("Error fetching booking:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    // URL se booking id lo
    const bookingId = req.params.id;

    // Booking find karo
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check karo logged-in user isi booking ka owner hai ya nahi
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking",
      });
    }

    // Agar booking pehle hi cancelled hai
    if (
      booking.bookingStatus === "cancelled" ||
      booking.bookingStatus === "expired"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled",
      });
    }

    // Booking cancel karo
    booking.bookingStatus = "cancelled";

    // Agar payment ho chuki thi to future me refund process hoga
    // booking.paymentStatus = "refunded";

    // Updated booking save karo
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.log("Error cancelling booking:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get seatlayout jo frontend pr dikhega mongodb or redis both combined kitni seats hai (Booked + Locked Seats)
const getSeatLayout = async (req, res) => {
  try {
    // URL se show id lo
    const { showId } = req.params;

    // check kro show exist krta h y ni
    const show = await Show.findById(showId);

    // show nhi mila to
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // MongoDB se sirf successful booked seats nikalo
    const bookings = await Booking.find({
      show: showId,
      // Sirf jinki payment successful hui hai
      paymentStatus: "paid",
      // Sirf confirmed(booked) bookings
      bookingStatus: "booked",
    });

    // MongoDB se booked seats store karenge, as mongodb obj deta hi jisme or b data hota hai pr hme sirf seats chahiye
    const bookedSeats = [];

    // Har booking ke andar loop
    for (const booking of bookings) {
      // jitni seats hain unhe array me add karo us booking k andr
      for (const seat of booking.seats) {
        bookedSeats.push(seat);
      }
    }

    // Redis se temporary locked seats lao
    const lockedSeats = await getLockedSeats(showId);

    res.status(200).json({
      success: true,
      message: "Seat layout fetched successfully",

      // MongoDB wali permanent booked seats
      bookedSeats,

      // Redis wali temporary locked seats
      lockedSeats,
    });
  } catch (error) {
    console.log("Error fetching seat layout:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getMyBookings,
  getBookingById,
  createBooking,
  cancelBooking,
  getSeatLayout,
};
