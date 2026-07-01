const { unlockSeat } = require("./seatLockService");

// Booking ko payment successful banane ka common function -> direct webhook bakend s verify krega
// payment controller wale m frontend backend dono use krega  or verify krega payment
const completeBookingPayment = async (booking, paymentId, paymentSignature) => {
  // Payment details save karo mongodb m booking wala schema/model usme field h ye 
  booking.paymentId = paymentId;
  booking.paymentSignature = paymentSignature;

  // Booking confirm
  booking.paymentStatus = "paid";
  booking.bookingStatus = "booked";

  // MongoDB save
  await booking.save();

  // Redis locks hata do
  for (const seat of booking.seats) {
    await unlockSeat(booking.show.toString(), seat);
  }

  return booking;
};

module.exports = {
  completeBookingPayment,
};
