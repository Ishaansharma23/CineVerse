// Payment genuine mil gayi, ab booking finalize karo.

const { generateTicketQr } = require("./qrService");
const { unlockSeat } = require("./seatLockService");
const { getIO } = require("../config/socket");
const { sendTicketEmail } = require("./emailService");
const { generateTicketPdf } = require("./pdfService");

// Booking ko payment successful banane ka common function -> direct webhook bakend s verify krega
// payment controller wale m frontend backend dono use krega  or verify krega payment
const completeBookingPayment = async (booking, paymentId, paymentSignature) => {
  // Payment details save karo mongodb m booking wala schema/model usme field h ye
  booking.paymentId = paymentId;
  booking.paymentSignature = paymentSignature;

  // Booking confirm
  booking.paymentStatus = "paid";
  booking.bookingStatus = "booked";

  // Show aur Movie ki details lao
  await booking.populate([
    {
      path: "user",
    },
    {
      path: "show",
      populate: {
        path: "movie",
      },
    },
  ]);

  // QR Generate karo
  booking.ticketQr = await generateTicketQr(booking);

    // PDF Generate karo
const pdfPath = await generateTicketPdf(
  booking
);

  // MongoDB save
  await booking.save();

  // User ko ticket email bhejo
  try {
    await sendTicketEmail(booking.user.email, booking, pdfPath);
  } catch (error) {
    console.log("Email Error:", error);
  }

  // Redis locks hata do
  for (const seat of booking.seats) {
    await unlockSeat(booking.show._id.toString(), seat);
  }

  const io = getIO();

  io.to(booking.show._id.toString()).emit("seat-booked", {
    showId: booking.show._id,
    seats: booking.seats,
  });

  return booking;
};

module.exports = {
  completeBookingPayment,
};
