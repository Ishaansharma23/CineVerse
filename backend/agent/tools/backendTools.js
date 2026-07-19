const Movie = require("../../models/Movie");
const Theatre = require("../../models/Theatre");
const Show = require("../../models/Show");
const Booking = require("../../models/bookings");
const Payment = require("../../models/Payment");
const { lockSeat, unlockSeat, getLockedSeats } = require("../../services/seatLockService");
const { calculateRefundAmount } = require("../../services/refundService");
const { sendRefundEmail } = require("../../services/emailService");
const { getIO } = require("../../config/socket");
const razorpay = require("../../config/razorpay");

const searchMovieTool = async (query) => {
  try {
    const movies = await Movie.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { genre: { $regex: query, $options: "i" } },
      ],
    });
    return movies;
  } catch (err) {
    console.error("searchMovieTool error:", err);
    return [];
  }
};

const searchNearbyTheatresTool = async (query) => {
  try {
    const theatres = await Theatre.find({
      $or: [
        { city: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    });
    return theatres;
  } catch (err) {
    console.error("searchNearbyTheatresTool error:", err);
    return [];
  }
};

const findShowsTool = async (movieId, dateStr) => {
  try {
    // Input date query matching
    const query = { movie: movieId };
    if (dateStr) {
      // Handle "tomorrow" or "today" from LLM parsed ISO dates
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    const shows = await Show.find(query)
      .populate("movie")
      .populate({
        path: "screen",
        populate: {
          path: "theatre",
        },
      });
    return shows;
  } catch (err) {
    console.error("findShowsTool error:", err);
    return [];
  }
};

const getSeatLayoutTool = async (showId) => {
  try {
    const show = await Show.findById(showId).populate("screen");
    if (!show) return null;

    // Get locked seats from Redis
    const lockedSeats = await getLockedSeats(showId);

    // Get booked seats from MongoDB bookings
    const bookings = await Booking.find({
      show: showId,
      bookingStatus: "booked",
    });

    const bookedSeats = [];
    bookings.forEach((b) => {
      bookedSeats.push(...b.seats);
    });

    const rows = show.screen.totalRows || 8;
    const seatsPerRow = show.screen.seatsPerRow || 10;
    const allSeats = [];

    for (let r = 1; r <= rows; r++) {
      const rowLetter = String.fromCharCode(64 + r);
      for (let s = 1; s <= seatsPerRow; s++) {
        const name = `${rowLetter}${s}`;
        const isBooked = bookedSeats.includes(name);
        const isLocked = lockedSeats.includes(name);
        allSeats.push({ name, isBooked, isLocked, available: !isBooked && !isLocked });
      }
    }

    return allSeats;
  } catch (err) {
    console.error("getSeatLayoutTool error:", err);
    return null;
  }
};

const reserveSeatsTool = async (userId, showId, seatCount) => {
  try {
    const show = await Show.findById(showId);
    if (!show || show.status !== "scheduled") {
      return { success: false, message: "Show is not available for booking." };
    }

    // Find available seats
    const layout = await getSeatLayoutTool(showId);
    const available = layout.filter((s) => s.available);
    
    if (available.length < seatCount) {
      return { success: false, message: `Only ${available.length} seats are available.` };
    }

    // Attempt adjacent seats allocation
    let seatsToBook = [];
    // Simple greedy check for adjacent seats
    for (let i = 0; i <= available.length - seatCount; i++) {
      const subset = available.slice(i, i + seatCount);
      let isAdjacent = true;
      for (let j = 0; j < subset.length - 1; j++) {
        const row1 = subset[j].name.charAt(0);
        const row2 = subset[j + 1].name.charAt(0);
        const col1 = parseInt(subset[j].name.slice(1));
        const col2 = parseInt(subset[j + 1].name.slice(1));
        if (row1 !== row2 || Math.abs(col1 - col2) !== 1) {
          isAdjacent = false;
          break;
        }
      }
      if (isAdjacent) {
        seatsToBook = subset.map((s) => s.name);
        break;
      }
    }

    if (seatsToBook.length === 0) {
      // Fallback: take first available
      seatsToBook = available.slice(0, seatCount).map((s) => s.name);
    }

    // Lock seats in Redis
    const lockedSeats = [];
    for (const seat of seatsToBook) {
      const lockResult = await lockSeat(showId, seat, userId);
      if (!lockResult.success) {
        // Rollback already locked
        for (const ls of lockedSeats) {
          await unlockSeat(showId, ls);
        }
        return { success: false, message: `Seat ${seat} was locked by another transaction.` };
      }
      lockedSeats.push(seat);
    }

    const totalAmount = seatsToBook.length * show.price;
    const bookingId = `CV-${Date.now()}`;

    // Create booking doc
    const booking = await Booking.create({
      user: userId,
      show: showId,
      seats: seatsToBook,
      totalAmount,
      bookingId,
      paymentStatus: "pending",
      bookingStatus: "pending",
      bookingExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute lock
    });

    // Notify socket clients
    try {
      const io = getIO();
      io.to(showId.toString()).emit("seat-locked", { showId, seats: seatsToBook });
    } catch (e) {
      console.error("Socket error on lock notify:", e);
    }

    return { success: true, booking };
  } catch (err) {
    console.error("reserveSeatsTool error:", err);
    return { success: false, message: err.message };
  }
};

const cancelBookingTool = async (userId, bookingId) => {
  try {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) return { success: false, message: "Booking record not found." };

    if (booking.user.toString() !== userId.toString()) {
      return { success: false, message: "Unauthorized cancellation request." };
    }

    if (booking.bookingStatus === "cancelled" || booking.bookingStatus === "expired") {
      return { success: false, message: "Booking is already cancelled or expired." };
    }

    // Case 1: Payment Pending
    if (booking.paymentStatus === "pending") {
      booking.bookingStatus = "cancelled";
      booking.paymentStatus = "failed";
      await booking.save();

      // Update corresponding Payment document
      if (booking.orderId) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: booking.orderId },
          { status: "failed" }
        );
      }

      for (const seat of booking.seats) {
        await unlockSeat(booking.show.toString(), seat);
      }

      try {
        const io = getIO();
        io.to(booking.show.toString()).emit("seat-unlocked", { showId: booking.show, seats: booking.seats });
      } catch (e) {}

      return { success: true, message: "Pending booking cancelled successfully." };
    }

    // Case 2: Paid ticket refund validation
    const show = await Show.findById(booking.show);
    const refund = await calculateRefundAmount(booking, show);

    if (!refund.eligible) {
      return { success: false, message: "Booking cannot be cancelled within 2 hours of show time." };
    }

    // Razorpay refund API invocation
    const razorpayRefund = await razorpay.payments.refund(booking.paymentId, {
      amount: refund.refundAmount * 100, // in paisa
    });

    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "refunded";
    booking.refundId = razorpayRefund.id;
    booking.refundAmount = refund.refundAmount;
    await booking.save();

    // Update corresponding Payment document
    if (booking.orderId) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: booking.orderId },
        {
          status: "refunded",
          $push: {
            refunds: {
              refundId: razorpayRefund.id,
              amount: refund.refundAmount,
              status: "processed",
              createdAt: new Date(),
            },
          },
        }
      );
    }

    // Release Redis seat locks
    for (const seat of booking.seats) {
      await unlockSeat(booking.show.toString(), seat);
    }

    // Emit event and notify customer email
    try {
      const io = getIO();
      io.to(booking.show.toString()).emit("seat-unlocked", { showId: booking.show, seats: booking.seats });
    } catch (e) {}

    try {
      await sendRefundEmail(booking, refund.refundAmount);
    } catch (e) {
      console.error("Error sending refund email notification:", e);
    }

    return { success: true, message: "Ticket cancelled successfully and refund initiated.", refundAmount: refund.refundAmount };
  } catch (err) {
    console.error("cancelBookingTool error:", err);
    return { success: false, message: err.message };
  }
};

const getBookingHistoryTool = async (userId) => {
  try {
    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: [
          { path: "movie" },
          {
            path: "screen",
            populate: { path: "theatre" }
          }
        ]
      })
      .sort({ createdAt: -1 });
    return bookings;
  } catch (err) {
    console.error("getBookingHistoryTool error:", err);
    return [];
  }
};

const rescheduleBookingTool = async (userId, oldBookingId, newShowId) => {
  try {
    const booking = await Booking.findOne({ bookingId: oldBookingId });
    if (!booking) return { success: false, message: "Active booking details not found." };

    if (booking.user.toString() !== userId.toString()) {
      return { success: false, message: "Unauthorized reschedule access request." };
    }

    if (booking.bookingStatus !== "booked") {
      return { success: false, message: "Only confirmed paid bookings can be rescheduled." };
    }

    // Original showtime buffer eligibility validation
    const oldShow = await Show.findById(booking.show);
    const refundInfo = await calculateRefundAmount(booking, oldShow);
    if (!refundInfo.eligible) {
      return { success: false, message: "Rescheduling is blocked within 2 hours of the original showtime." };
    }

    const newShow = await Show.findById(newShowId);
    if (!newShow || newShow.status !== "scheduled") {
      return { success: false, message: "Proposed showtime is not scheduled." };
    }

    // Find equivalent layout seats
    const layout = await getSeatLayoutTool(newShowId);
    const available = layout.filter((s) => s.available);
    if (available.length < booking.seats.length) {
      return { success: false, message: "Proposed show has insufficient seat vacancy." };
    }

    // Pick seats matching original layout name tags if possible, or fallback greedy
    let newSeats = [];
    const needed = booking.seats.length;
    
    // Try to matches exact original seats (e.g. A3, A4)
    const exactMatches = available.filter(s => booking.seats.includes(s.name)).map(s => s.name);
    if (exactMatches.length === needed) {
      newSeats = exactMatches;
    } else {
      newSeats = available.slice(0, needed).map(s => s.name);
    }

    // Redis locks for new seats
    const newLocks = [];
    for (const seat of newSeats) {
      const lockResult = await lockSeat(newShowId, seat, userId);
      if (!lockResult.success) {
        for (const l of newLocks) await unlockSeat(newShowId, l);
        return { success: false, message: `Seat ${seat} is occupied.` };
      }
      newLocks.push(seat);
    }

    // Unlock old seats
    for (const oldSeat of booking.seats) {
      await unlockSeat(booking.show.toString(), oldSeat);
    }

    // Update show and seats
    const oldShowId = booking.show;
    const oldSeats = booking.seats;

    booking.show = newShowId;
    booking.seats = newSeats;
    await booking.save();

    // Trigger sockets
    try {
      const io = getIO();
      io.to(oldShowId.toString()).emit("seat-unlocked", { showId: oldShowId, seats: oldSeats });
      io.to(newShowId.toString()).emit("seat-locked", { showId: newShowId, seats: newSeats });
    } catch (e) {}

    return { success: true, booking };
  } catch (err) {
    console.error("rescheduleBookingTool error:", err);
    return { success: false, message: err.message };
  }
};

module.exports = {
  searchMovieTool,
  searchNearbyTheatresTool,
  findShowsTool,
  getSeatLayoutTool,
  reserveSeatsTool,
  cancelBookingTool,
  getBookingHistoryTool,
  rescheduleBookingTool,
};
