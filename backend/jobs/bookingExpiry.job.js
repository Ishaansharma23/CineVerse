const cron = require("node-cron");
const Booking = require("../models/bookings");
const { unlockSeat } = require("../services/seatLockService");
const { getIO } = require("../config/socket");

// Har 1 minute me chalega
const bookingExpiryJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("Checking expired bookings...");

      // Jinki expiry time nikal chuki hai aur payment abhi bhi pending hai
      const expiredBookings = await Booking.find({
        paymentStatus: "pending",
        bookingStatus: "pending",
        bookingExpiresAt: {
          $lte: new Date(),
        },
      });

      console.log(`Found ${expiredBookings.length} expired bookings`);

      // Socket instance
      const io = getIO();

      // Har expired booking process karo
      for (const booking of expiredBookings) {

        // Booking status update
        booking.bookingStatus = "expired";

        // (Optional) Payment status update
        booking.paymentStatus = "failed";

        // MongoDB save
        await booking.save();

        // Redis locks hatao
        for (const seat of booking.seats) {
          await unlockSeat(booking.show.toString(), seat);
        }

        // Sab connected users ko bata do
        io.to(booking.show.toString()).emit("seat-unlocked", {
          showId: booking.show,
          seats: booking.seats,
        });

        console.log(
          `Booking ${booking.bookingId} expired and seats unlocked`
        );
      }
    } catch (error) {
      console.log("Booking Expiry Cron Error:", error);
    }
  });
};

module.exports = {
  bookingExpiryJob,
};
