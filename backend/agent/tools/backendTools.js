const Movie = require("../../models/Movie");
const Theatre = require("../../models/Theatre");
const Screen = require("../../models/Screen");
const Show = require("../../models/Show");
const Booking = require("../../models/bookings");
const Payment = require("../../models/Payment");
const { lockSeat, unlockSeat, getLockedSeats } = require("../../services/seatLockService");
const { calculateRefundAmount } = require("../../services/refundService");
const { sendRefundEmail } = require("../../services/emailService");
const { getIO } = require("../../config/socket");
const razorpay = require("../../config/razorpay");
const { storePreference } = require("../rag/pinecone");

/**
 * Search movies by title or genre.
 * If query is provided, performs regex search. If empty, returns top active movies.
 */
const searchMovieTool = async (query) => {
  try {
    if (!query || query.trim() === "") {
      return await Movie.find({ isActive: true }).sort({ popularity: -1 }).limit(10);
    }
    const movies = await Movie.find({
      isActive: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { genres: { $in: [new RegExp(query, "i")] } },
      ],
    }).limit(10);
    return movies;
  } catch (err) {
    console.error("searchMovieTool error:", err);
    return [];
  }
};

/**
 * Search top trending movies
 */
const searchTrendingMoviesTool = async () => {
  try {
    const movies = await Movie.find({ isActive: true })
      .sort({ popularity: -1, rating: -1 })
      .limit(10);
    return movies;
  } catch (err) {
    console.error("searchTrendingMoviesTool error:", err);
    return [];
  }
};

/**
 * Get theatres that actually have scheduled shows for a specific movie.
 * Queries ONLY the Show collection (Show -> Screen -> Theatre) as single source of truth.
 * Never queries Theatre collection directly.
 */
const getMovieTheatresTool = async (movieId) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const query = {
      status: "scheduled",
      date: { $gte: todayStart },
    };

    if (movieId) {
      const movieDoc = typeof movieId === "object" ? movieId : await Movie.findById(movieId);
      if (movieDoc) {
        query.movie = movieDoc._id;
      } else if (typeof movieId === "string" && movieId.trim() !== "") {
        const m = await Movie.findOne({ title: { $regex: movieId, $options: "i" } });
        if (m) query.movie = m._id;
      }
    }

    const shows = await Show.find(query)
      .populate("movie")
      .populate({
        path: "screen",
        populate: { path: "theatre" },
      });

    const theatreMap = new Map();
    shows.forEach((s) => {
      const theatre = s.screen?.theatre;
      if (
        theatre &&
        theatre.isActive !== false &&
        (theatre.status === "approved" || !theatre.status)
      ) {
        const tId = theatre._id.toString();
        if (!theatreMap.has(tId)) {
          theatreMap.set(tId, theatre);
        }
      }
    });

    return Array.from(theatreMap.values());
  } catch (err) {
    console.error("getMovieTheatresTool error:", err);
    return [];
  }
};

/**
 * Backward compatibility alias for getMovieTheatresTool
 */
const searchNearbyTheatresTool = getMovieTheatresTool;

/**
 * Get future available dates for a movie / theatre directly from generated Show documents
 */
const searchAvailableDatesTool = async (movieId, theatreId) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const query = {
      status: "scheduled",
      date: { $gte: todayStart },
    };
    if (movieId) {
      const movieDoc = typeof movieId === "object" ? movieId : await Movie.findById(movieId);
      if (movieDoc) query.movie = movieDoc._id;
    }

    let shows = await Show.find(query)
      .populate("movie")
      .populate({
        path: "screen",
        populate: { path: "theatre" },
      });

    if (theatreId) {
      shows = shows.filter(
        (s) =>
          s.screen?.theatre?._id.toString() === theatreId.toString() ||
          s.screen?.theatre?.name?.toLowerCase().includes(String(theatreId).toLowerCase())
      );
    }

    const dateMap = new Map();
    shows.forEach((s) => {
      const showD = new Date(s.date);
      const year = showD.getFullYear();
      const month = String(showD.getMonth() + 1).padStart(2, "0");
      const day = String(showD.getDate()).padStart(2, "0");
      const fullDate = `${year}-${month}-${day}`;
      const displayDate = showD.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const dayName = showD.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      if (!dateMap.has(fullDate)) {
        dateMap.set(fullDate, { fullDate, displayDate, dayName });
      }
    });

    const dates = Array.from(dateMap.values()).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    return dates;
  } catch (err) {
    console.error("searchAvailableDatesTool error:", err);
    return [];
  }
};

/**
 * Get available showtimes for a movie and theatre on a specific date
 */
const searchShowTimesTool = async (movieId, theatreId, dateStr) => {
  try {
    const query = { status: "scheduled" };
    if (movieId) {
      const movieDoc = typeof movieId === "object" ? movieId : await Movie.findById(movieId);
      if (movieDoc) query.movie = movieDoc._id;
    }

    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      query.date = { $gte: todayStart };
    }

    let shows = await Show.find(query)
      .populate("movie")
      .populate({
        path: "screen",
        populate: { path: "theatre" },
      });

    if (theatreId) {
      shows = shows.filter(
        (s) =>
          s.screen?.theatre?._id.toString() === theatreId.toString() ||
          s.screen?.theatre?.name?.toLowerCase().includes(String(theatreId).toLowerCase())
      );
    }

    return shows;
  } catch (err) {
    console.error("searchShowTimesTool error:", err);
    return [];
  }
};

/**
 * Legacy compatibility findShowsTool
 */
const findShowsTool = async (movieId, dateStr) => {
  return await searchShowTimesTool(movieId, null, dateStr);
};

/**
 * Get Seat Layout
 */
const getSeatLayoutTool = async (showId) => {
  try {
    const show = await Show.findById(showId).populate("screen");
    if (!show) return null;

    const lockedSeats = await getLockedSeats(showId);
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

/**
 * Reserve / Lock Seats
 */
const reserveSeatsTool = async (userId, showId, seatCount) => {
  try {
    const show = await Show.findById(showId);
    if (!show || show.status !== "scheduled") {
      return { success: false, message: "Show is not available for booking." };
    }

    const layout = await getSeatLayoutTool(showId);
    const available = layout.filter((s) => s.available);
    
    if (available.length < seatCount) {
      return { success: false, message: `Only ${available.length} seats are available.` };
    }

    let seatsToBook = [];
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
      seatsToBook = available.slice(0, seatCount).map((s) => s.name);
    }

    const lockedSeats = [];
    for (const seat of seatsToBook) {
      const lockResult = await lockSeat(showId, seat, userId);
      if (!lockResult.success) {
        for (const ls of lockedSeats) {
          await unlockSeat(showId, ls);
        }
        return { success: false, message: `Seat ${seat} was locked by another user.` };
      }
      lockedSeats.push(seat);
    }

    const totalAmount = seatsToBook.length * show.price;
    const bookingId = `CV-${Date.now()}`;

    const booking = await Booking.create({
      user: userId,
      show: showId,
      seats: seatsToBook,
      totalAmount,
      bookingId,
      paymentStatus: "pending",
      bookingStatus: "pending",
      bookingExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      const io = getIO();
      io.to(showId.toString()).emit("seat-locked", { showId, seats: seatsToBook });
    } catch (e) {}

    return { success: true, booking };
  } catch (err) {
    console.error("reserveSeatsTool error:", err);
    return { success: false, message: err.message };
  }
};

/**
 * Cancel Booking & Process Refund logic
 */
const cancelBookingTool = async (userId, bookingId) => {
  try {
    const booking = await Booking.findOne({ bookingId }).populate({
      path: "show",
      populate: [{ path: "movie" }, { path: "screen", populate: { path: "theatre" } }],
    });
    if (!booking) return { success: false, message: "Booking record not found." };

    if (booking.user.toString() !== userId.toString()) {
      return { success: false, message: "Unauthorized cancellation request." };
    }

    if (booking.bookingStatus === "cancelled" || booking.bookingStatus === "expired") {
      return { success: false, message: "Booking is already cancelled or expired." };
    }

    if (booking.paymentStatus === "pending") {
      booking.bookingStatus = "cancelled";
      booking.paymentStatus = "failed";
      await booking.save();

      if (booking.orderId) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: booking.orderId },
          { status: "failed" }
        );
      }

      for (const seat of booking.seats) {
        await unlockSeat(booking.show._id.toString(), seat);
      }

      try {
        const io = getIO();
        io.to(booking.show._id.toString()).emit("seat-unlocked", { showId: booking.show._id, seats: booking.seats });
      } catch (e) {}

      return { success: true, message: "Pending booking cancelled successfully." };
    }

    const show = await Show.findById(booking.show._id || booking.show);
    const refund = await calculateRefundAmount(booking, show);

    if (!refund.eligible) {
      return { success: false, message: "Booking cannot be cancelled within 2 hours of show time." };
    }

    let razorpayRefundId = `RFND-${Date.now()}`;
    if (booking.paymentId) {
      try {
        const razorpayRefund = await razorpay.payments.refund(booking.paymentId, {
          amount: refund.refundAmount * 100,
        });
        razorpayRefundId = razorpayRefund.id;
      } catch (rzErr) {
        console.error("Razorpay refund API error, fallback to internal refund recording:", rzErr.message);
      }
    }

    booking.bookingStatus = "cancelled";
    booking.paymentStatus = "refunded";
    booking.refundId = razorpayRefundId;
    booking.refundAmount = refund.refundAmount;
    await booking.save();

    if (booking.orderId) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: booking.orderId },
        {
          status: "refunded",
          $push: {
            refunds: {
              refundId: razorpayRefundId,
              amount: refund.refundAmount,
              status: "processed",
              createdAt: new Date(),
            },
          },
        }
      );
    }

    for (const seat of booking.seats) {
      await unlockSeat(booking.show._id.toString(), seat);
    }

    try {
      const io = getIO();
      io.to(booking.show._id.toString()).emit("seat-unlocked", { showId: booking.show._id, seats: booking.seats });
    } catch (e) {}

    try {
      await sendRefundEmail(booking, refund.refundAmount);
    } catch (e) {}

    return {
      success: true,
      message: "Ticket cancelled successfully and refund initiated.",
      refundAmount: refund.refundAmount,
      bookingId: booking.bookingId,
    };
  } catch (err) {
    console.error("cancelBookingTool error:", err);
    return { success: false, message: err.message };
  }
};

/**
 * Get User Booking History
 */
const getBookingHistoryTool = async (userId) => {
  try {
    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: [
          { path: "movie" },
          {
            path: "screen",
            populate: { path: "theatre" },
          },
        ],
      })
      .sort({ createdAt: -1 });
    return bookings;
  } catch (err) {
    console.error("getBookingHistoryTool error:", err);
    return [];
  }
};

// refund wala 
const getRefundStatusTool = async (userId, bookingId) => {
  try {
    let query = { user: userId };
    const refundFilter = [
      { paymentStatus: "refunded" },
      { refundStatus: { $ne: null } },
      { refundId: { $ne: null } }
    ];

    if (bookingId) {
      query.bookingId = bookingId;
      query.$or = refundFilter;
    } else {
      query.$or = refundFilter;
    }

    const bookings = await Booking.find(query)
      .populate({
        path: "show",
        populate: [{ path: "movie" }, { path: "screen", populate: { path: "theatre" } }],
      })
      .sort({ updatedAt: -1 });

    if (!bookings || bookings.length === 0) {
      return {
        success: true,
        refundBookings: [],
        count: 0,
        message: "You don't have any refund requests yet.",
      };
    }

    const formattedRefunds = await Promise.all(
      bookings.map(async (b) => {
        const show = b.show ? await Show.findById(b.show._id || b.show) : null;
        const refundInfo = show ? await calculateRefundAmount(b, show) : { refundAmount: b.refundAmount || 0 };

        let statusLabel = "REFUND PENDING";
        if (b.refundStatus === "processed" || b.paymentStatus === "refunded") {
          statusLabel = "REFUNDED";
        } else if (b.refundStatus === "failed") {
          statusLabel = "REFUND FAILED";
        } else if (b.refundStatus === "pending") {
          statusLabel = "REFUND PENDING";
        }

        return {
          bookingId: b.bookingId,
          movieTitle: b.show?.movie?.title || "Movie",
          poster: b.show?.movie?.posterUrl || b.show?.movie?.poster || null,
          theatreName: b.show?.screen?.theatre?.name || "Cinema",
          seats: Array.isArray(b.seats) ? b.seats.join(", ") : b.seats || "N/A",
          date: b.show?.date ? new Date(b.show.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null,
          time: b.show?.startTime || null,
          totalAmount: b.totalAmount,
          refundAmount: b.refundAmount || refundInfo.refundAmount || b.totalAmount,
          refundStatus: statusLabel,
          paymentStatus: b.paymentStatus,
          bookingStatus: b.bookingStatus,
          eligible: refundInfo.eligible ?? true,
        };
      })
    );

    return {
      success: true,
      refundBookings: formattedRefunds,
      count: formattedRefunds.length,
    };
  } catch (err) {
    console.error("getRefundStatusTool error:", err);
    return { success: false, message: err.message };
  }
};


// Reschedule Booking

const rescheduleBookingTool = async (userId, oldBookingId, newShowId) => {
  try {
    const booking = await Booking.findOne({ bookingId: oldBookingId });
    if (!booking) return { success: false, message: "Active booking details not found." };

    if (booking.user.toString() !== userId.toString()) {
      return { success: false, message: "Unauthorized reschedule request." };
    }

    if (booking.bookingStatus !== "booked") {
      return { success: false, message: "Only confirmed paid bookings can be rescheduled." };
    }

    const oldShow = await Show.findById(booking.show);
    const refundInfo = await calculateRefundAmount(booking, oldShow);
    if (!refundInfo.eligible) {
      return { success: false, message: "Rescheduling is blocked within 2 hours of original showtime." };
    }

    const newShow = await Show.findById(newShowId);
    if (!newShow || newShow.status !== "scheduled") {
      return { success: false, message: "Proposed showtime is not scheduled." };
    }

    const layout = await getSeatLayoutTool(newShowId);
    const available = layout.filter((s) => s.available);
    if (available.length < booking.seats.length) {
      return { success: false, message: "Proposed show has insufficient vacancy." };
    }

    let newSeats = [];
    const needed = booking.seats.length;
    const exactMatches = available.filter((s) => booking.seats.includes(s.name)).map((s) => s.name);
    if (exactMatches.length === needed) {
      newSeats = exactMatches;
    } else {
      newSeats = available.slice(0, needed).map((s) => s.name);
    }

    const newLocks = [];
    for (const seat of newSeats) {
      const lockResult = await lockSeat(newShowId, seat, userId);
      if (!lockResult.success) {
        for (const l of newLocks) await unlockSeat(newShowId, l);
        return { success: false, message: `Seat ${seat} is occupied.` };
      }
      newLocks.push(seat);
    }

    for (const oldSeat of booking.seats) {
      await unlockSeat(booking.show.toString(), oldSeat);
    }

    const oldShowId = booking.show;
    const oldSeats = booking.seats;

    booking.show = newShowId;
    booking.seats = newSeats;
    await booking.save();

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

/**
 * Recommend Movies based on preferences
 */
const recommendMoviesTool = async (userId, preferences = {}) => {
  try {
    const { genre, language, mood } = preferences;
    const filter = { isActive: true };

    if (genre) {
      filter.genres = { $in: [new RegExp(genre, "i")] };
    }
    if (language) {
      filter.language = new RegExp(language, "i");
    }

    let movies = await Movie.find(filter).sort({ popularity: -1 }).limit(10);
    if (movies.length === 0) {
      movies = await Movie.find({ isActive: true }).sort({ popularity: -1 }).limit(10);
    }
    return movies;
  } catch (err) {
    console.error("recommendMoviesTool error:", err);
    return [];
  }
};

/**
 * Dedicated backend tool for saving user preference (RAG persistence)
 */
const saveUserPreferenceTool = async (userId, preferenceText) => {
  try {
    if (!userId || !preferenceText) return false;
    await storePreference(userId, preferenceText);
    return true;
  } catch (err) {
    console.error("saveUserPreferenceTool error:", err);
    return false;
  }
};

module.exports = {
  searchMovieTool,
  searchTrendingMoviesTool,
  getMovieTheatresTool,
  searchNearbyTheatresTool,
  searchAvailableDatesTool,
  searchShowTimesTool,
  findShowsTool,
  getSeatLayoutTool,
  reserveSeatsTool,
  cancelBookingTool,
  getBookingHistoryTool,
  getRefundStatusTool,
  rescheduleBookingTool,
  recommendMoviesTool,
  saveUserPreferenceTool,
};
