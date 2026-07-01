const cron = require("node-cron");
const Booking = require("../models/bookings");
const { unlockSeat } = require("../services/seatLockService");

// ye pichli jitni b logo n 5 min pehle curr time s booking kri lekinpayment nahi kre unka status pending s 
// hata kr remove krdega unki booking ka status (del nahi kr rhe booking) sirf status update
//  (jaise hi kisi ne 5min s jyada late payment kre) 

// Har 1 minute me chalega  
cron.schedule("* * * * *", async () => {
  try {
    console.log("Checking expired bookings...");

    // Current time se 5 minute pehle ka time
    const fiveMinutesAgo = new Date(
      Date.now() - 5 * 60 * 1000
    );

    // Pending aur 5 minute se purani bookings
    const expiredBookings = await Booking.find({
      paymentStatus: "pending",
      bookingStatus: "pending",
      createdAt: {
        $lte: fiveMinutesAgo,
      },
    });

    console.log(
      `Found ${expiredBookings.length} expired bookings`
    );

  } catch (error) {
    console.log("Booking Expiry Cron Error:", error);
  }
});