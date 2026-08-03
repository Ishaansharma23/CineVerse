const cron = require("node-cron");
const Booking = require("../models/bookings");
const { sendAbandonedBookingReminderEmail } = require("../services/emailService");

const abandonedBookingReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const reminderThreshold = new Date(Date.now() - 60 * 1000);

      const abandonedBookings = await Booking.find({
        paymentStatus: "pending",
        bookingStatus: "pending",
        paymentReminderSent: { $ne: true },
        createdAt: { $lte: reminderThreshold },
      })
        .populate("user")
        .populate({
          path: "show",
          populate: [
            { path: "movie" },
            {
              path: "screen",
              populate: { path: "theatre" },
            },
          ],
        });

      for (const booking of abandonedBookings) {
        try {
          // Always mark paymentReminderSent = true first to prevent retries or duplicate attempts
          booking.paymentReminderSent = true;
          await booking.save();

          if (!booking.user || !booking.user.email) {
            continue;
          }

          await sendAbandonedBookingReminderEmail(booking);

          console.log(`[Abandoned Booking Job] Sent reminder email for booking ${booking.bookingId} (${booking.user.email})`);
        } catch (emailErr) {
          console.error(`[Abandoned Booking Job] Failed to send email for booking ${booking.bookingId}:`, emailErr.message);
        }
      }
    } catch (error) {
      console.error("[Abandoned Booking Job] Cron execution error:", error);
    }
  });
};

module.exports = {
  abandonedBookingReminderJob,
};
