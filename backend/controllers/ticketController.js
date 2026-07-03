const Booking = require("../models/bookings");

// Theatre staff QR scan karega
// QR ke andar se bookingId aayegi
const verifyTicket = async (req, res) => {
  try {

    // Frontend QR scan karke bookingId bhejega
    const { bookingId } = req.body;

    // Booking id di ya nahi
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking Id is required",
      });
    }

    // Booking find karo
    const booking = await Booking.findOne({
      bookingId,
    });

    // Booking nahi mili
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Cancelled ticket
    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Ticket is cancelled",
      });
    }

    // Expired ticket
    if (booking.bookingStatus === "expired") {
      return res.status(400).json({
        success: false,
        message: "Ticket expired",
      });
    }

    // Payment hui hi nahi
    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // Pehle hi scan ho chuka
    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: "Ticket already used",
      });
    }

    // First time scan
    booking.checkedIn = true;

    // Entry ka time save karo
    booking.checkedInAt = new Date();

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Entry Allowed",
      booking,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  }
};

module.exports = {
  verifyTicket,
};