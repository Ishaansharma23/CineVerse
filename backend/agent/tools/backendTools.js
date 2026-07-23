const Movie = require("../../models/Movie");
const Theatre = require("../../models/Theatre");
const Screen = require("../../models/Screen");
const Show = require("../../models/Show");
const Booking = require("../../models/bookings");
const Payment = require("../../models/Payment");
const {
  lockSeat,
  unlockSeat,
  getLockedSeats,
} = require("../../services/seatLockService");
const { calculateRefundAmount } = require("../../services/refundService");
const { sendRefundEmail } = require("../../services/emailService");
const { getIO } = require("../../config/socket");
const { storePreference, retrievePreferences } = require("../rag/pinecone");

const searchMovieTool = async (query) => {
  try {
    if (!query || typeof query !== "string" || query.trim() === "") {
      return await Movie.find({ isActive: true })
        .sort({ popularity: -1 })
        .limit(10);
    }

    const rawQuery = query.trim();

    let cleanedQuery = rawQuery
      .replace(
        /\b(book|booking|movie|movies|film|films|ticket|tickets|for|today|tonight|tomorrow|show|shows|please|can i|i want to|want)\b/gi,
        ""
      )
      .trim();

    if (!cleanedQuery) {
      return await Movie.find({ isActive: true })
        .sort({ popularity: -1 })
        .limit(10);
    }

    let movies = await Movie.find({
      isActive: true,
      $or: [
        { title: { $regex: cleanedQuery, $options: "i" } },
        { genres: { $in: [new RegExp(cleanedQuery, "i")] } },
      ],
    }).limit(10);

    if (movies.length === 0 && cleanedQuery !== rawQuery) {
      movies = await Movie.find({
        isActive: true,
        $or: [
          { title: { $regex: rawQuery, $options: "i" } },
          { genres: { $in: [new RegExp(rawQuery, "i")] } },
        ],
      }).limit(10);
    }

    return movies;
  } catch (err) {
    console.error("searchMovieTool error:", err);
    return [];
  }
};

const searchTrendingMoviesTool = async () => {
  try {
    return await Movie.find({ isActive: true })
      .sort({ popularity: -1, rating: -1 })
      .limit(10);
  } catch (err) {
    console.error("searchTrendingMoviesTool error:", err);
    return [];
  }
};

const isFutureShowTime = (show) => {
  if (!show || !show.date) return false;

  const showDateTime = new Date(show.date);
  let hours = 0;
  let minutes = 0;

  if (show.startTime) {
    const parts = String(show.startTime).trim().split(" ");
    const timeParts = parts[0].split(":").map(Number);
    hours = timeParts[0] || 0;
    minutes = timeParts[1] || 0;
    if (parts.length === 2) {
      const modifier = parts[1].toUpperCase();
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
    }
  }

  showDateTime.setHours(hours, minutes, 0, 0);
  const now = new Date();
  
  return showDateTime > now;
};

const getMovieTheatresTool = async (movieId) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const query = {
      status: "scheduled",
      date: { $gte: todayStart },
    };

    if (movieId) {
      const movieDoc =
        typeof movieId === "object" ? movieId : await Movie.findById(movieId);
      if (movieDoc) {
        query.movie = movieDoc._id;
      } else if (typeof movieId === "string" && movieId.trim() !== "") {
        const m = await Movie.findOne({
          title: { $regex: movieId, $options: "i" },
        });
        if (m) query.movie = m._id;
      }
    }

    const shows = await Show.find(query)
      .populate("movie")
      .populate({
        path: "screen",
        populate: { path: "theatre" },
      });

    const futureShows = shows.filter((s) => isFutureShowTime(s));

    const theatreMap = new Map();
    futureShows.forEach((s) => {
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

const GeneralChatTool = () => {
  return {
    platformName: "CineVerse",
    refundPolicy: {
      cancellationWindow:
        "Tickets can be cancelled up to 2 hours before the scheduled showtime.",
      nonRefundableWindow:
        "No cancellations or refunds within 2 hours of showtime or after the show has started.",
      refundRates: [
        { timeFrame: "48+ hours before showtime", refundPercentage: "100%" },
        {
          timeFrame: "24 to 48 hours before showtime",
          refundPercentage: "75%",
        },
        { timeFrame: "2 to 24 hours before showtime", refundPercentage: "50%" },
        {
          timeFrame: "Less than 2 hours / Post showtime",
          refundPercentage: "0% (Not eligible)",
        },
      ],
      refundMode:
        "Processed back to original payment method via Razorpay within 3-5 business days.",
    },
    cancellationPolicy: {
      eligibility:
        "Only active, confirmed tickets with status 'booked' can be cancelled.",
      pendingBookings:
        "Pending or unpaid bookings automatically expire after 5 minutes.",
      partialCancellation:
        "All seats in a single ticket booking must be cancelled together as a unit.",
    },
    bookingProcess: {
      steps: [
        "Select Movie",
        "Select Cinema / Theatre",
        "Select Show Date",
        "Select Showtime",
        "Select Seats & Complete Payment",
      ],
      seatLockDuration:
        "Seats are locked in real-time for 5 minutes during checkout.",
    },
    paymentMethods: [
      "UPI (GPay, PhonePe, Paytm)",
      "Credit & Debit Cards (Visa, Mastercard, RuPay)",
      "Netbanking",
      "Razorpay Gateway",
    ],
    ticketQR: {
      qrInfo:
        "Digital QR code is displayed on your ticket page immediately after payment.",
      entryRule:
        "Show digital QR code at cinema hall entry. Physical printouts are not required.",
    },
    checkInRules: {
      arrivalTime: "Please arrive 15 minutes prior to showtime.",
      outsideFood:
        "Outside food and beverages are strictly prohibited inside cinema halls.",
    },
    aiBuddyCapabilities: [
      "Searching movies, trending titles, and recommendations",
      "Finding theatres, available dates, and showtimes",
      "Checking ticket booking history",
      "Initiating ticket cancellations and refunds for eligible shows",
      "Tracking refund request status",
    ],
  };
};

const normalizeDate = (dateInput) => {
  if (!dateInput || typeof dateInput !== "string") return null;

  const input = dateInput.trim().toLowerCase();
  if (!input) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (input === "today") {
    return today.toISOString().split("T")[0];
  }

  if (input === "tomorrow") {
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);
    return tom.toISOString().split("T")[0];
  }

  if (input === "day after tomorrow" || input === "overmorrow") {
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    return dayAfter.toISOString().split("T")[0];
  }

  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = daysOfWeek.findIndex((d) => input.includes(d));

  if (dayIndex !== -1) {
    const targetDate = new Date(today);
    let diff = dayIndex - today.getDay();
    if (diff <= 0) diff += 7;
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toISOString().split("T")[0];
  }

  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
};

const searchAvailableDatesTool = async (movieId, theatreId) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const query = {
      status: "scheduled",
      date: { $gte: todayStart },
    };

    if (movieId) {
      const movieDoc =
        typeof movieId === "object" ? movieId : await Movie.findById(movieId);
      if (movieDoc) query.movie = movieDoc._id;
    }

    let shows = await Show.find(query)
      .populate("movie")
      .populate({
        path: "screen",
        populate: { path: "theatre" },
      });

    shows = shows.filter((s) => isFutureShowTime(s));

    if (theatreId) {
      shows = shows.filter(
        (s) =>
          s.screen?.theatre?._id.toString() === theatreId.toString() ||
          s.screen?.theatre?.name
            ?.toLowerCase()
            .includes(String(theatreId).toLowerCase())
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
      const dayName = showD
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();
      if (!dateMap.has(fullDate)) {
        dateMap.set(fullDate, { fullDate, displayDate, dayName });
      }
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      a.fullDate.localeCompare(b.fullDate)
    );
  } catch (err) {
    console.error("searchAvailableDatesTool error:", err);
    return [];
  }
};

const searchShowTimesTool = async (movieId, theatreId, dateStr) => {
  try {
    const query = { status: "scheduled" };

    if (movieId) {
      const movieDoc =
        typeof movieId === "object" ? movieId : await Movie.findById(movieId);
      if (movieDoc) query.movie = movieDoc._id;
    }

    const validDate = normalizeDate(dateStr);
    if (validDate) {
      const startOfDay = new Date(validDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(validDate);
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

    shows = shows.filter((s) => isFutureShowTime(s));

    if (theatreId) {
      shows = shows.filter(
        (s) =>
          s.screen?.theatre?._id.toString() === theatreId.toString() ||
          s.screen?.theatre?.name
            ?.toLowerCase()
            .includes(String(theatreId).toLowerCase())
      );
    }

    if (shows.length > 0) {
      return { shows, todayEnded: false };
    }

    const availableDates = await searchAvailableDatesTool(movieId, theatreId);
    const todayISO = new Date().toISOString().split("T")[0];
    const futureDates = availableDates.filter((d) => d.fullDate !== todayISO);

    if (futureDates.length > 0) {
      return {
        shows: [],
        todayEnded: true,
        nextAvailableDate: futureDates[0],
        availableDates: futureDates,
      };
    }

    return { shows: [], todayEnded: false };
  } catch (err) {
    console.error("searchShowTimesTool error:", err);
    return { shows: [], todayEnded: false };
  }
};

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
        allSeats.push({
          name,
          isBooked,
          isLocked,
          available: !isBooked && !isLocked,
        });
      }
    }

    return allSeats;
  } catch (err) {
    console.error("getSeatLayoutTool error:", err);
    return null;
  }
};

const reserveSeatsTool = async (userId, showId, seatCount, explicitSeats = null) => {
  try {
    const show = await Show.findById(showId);
    if (!show || show.status !== "scheduled") {
      return { success: false, message: "Show is not available for booking." };
    }
    if (!isFutureShowTime(show)) {
      return { success: false, message: "This showtime has already ended and is no longer available for booking." };
    }

    const layout = await getSeatLayoutTool(showId);
    const available = layout.filter((s) => s.available);

    let seatsToBook = [];
    if (Array.isArray(explicitSeats) && explicitSeats.length > 0) {
      const availableNames = available.map((s) => s.name);
      const invalidRequested = explicitSeats.filter((s) => !availableNames.includes(s));
      if (invalidRequested.length > 0) {
        return {
          success: false,
          message: `Seats ${invalidRequested.join(", ")} are no longer available. Please select different seats.`,
        };
      }
      seatsToBook = explicitSeats;
    } else {
      if (available.length < seatCount) {
        return {
          success: false,
          message: `Only ${available.length} seats are available.`,
        };
      }

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
    }

    const lockedSeats = [];
    for (const seat of seatsToBook) {
      const lockResult = await lockSeat(showId, seat, userId);
      if (!lockResult.success) {
        for (const ls of lockedSeats) {
          await unlockSeat(showId, ls);
        }
        return {
          success: false,
          message: `Seat ${seat} was locked by another user.`,
        };
      }
      lockedSeats.push(seat);
    }

    const { calculateBookingPricing } = require("../../services/pricingService");
    let subtotal = seatsToBook.length * show.price;
    let convenienceFee = 30 * seatsToBook.length;
    let gst = Math.round(0.18 * (subtotal + convenienceFee));
    let totalAmount = subtotal + convenienceFee + gst;

    try {
      const pricing = await calculateBookingPricing(seatsToBook.length, show.price);
      subtotal = pricing.subtotal;
      convenienceFee = pricing.convenienceFee;
      gst = pricing.gst;
      totalAmount = pricing.totalAmount;
    } catch (e) {}

    const bookingId = `CV-${Date.now()}`;

    const booking = await Booking.create({
      user: userId,
      show: showId,
      seats: seatsToBook,
      subtotal,
      convenienceFee,
      gst,
      totalAmount,
      bookingId,
      paymentStatus: "pending",
      bookingStatus: "pending",
      bookingExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      const io = getIO();
      io.to(showId.toString()).emit("seat-locked", {
        showId,
        seats: seatsToBook,
      });
    } catch (e) {}

    return { success: true, booking };
  } catch (err) {
    console.error("reserveSeatsTool error:", err);
    return { success: false, message: err.message };
  }
};

const cancelBookingTool = async (userId, bookingId) => {
  try {
    const booking = await Booking.findOne({ bookingId }).populate({
      path: "show",
      populate: [
        { path: "movie" },
        { path: "screen", populate: { path: "theatre" } },
      ],
    });
    if (!booking)
      return { success: false, message: "Booking record not found." };

    if (booking.user.toString() !== userId.toString()) {
      return { success: false, message: "Unauthorized cancellation request." };
    }

    if (
      booking.bookingStatus === "cancelled" ||
      booking.bookingStatus === "expired"
    ) {
      return {
        success: false,
        message: "Booking is already cancelled or expired.",
      };
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
        io.to(booking.show._id.toString()).emit("seat-unlocked", {
          showId: booking.show._id,
          seats: booking.seats,
        });
      } catch (e) {}

      return {
        success: true,
        message: "Pending booking cancelled successfully.",
      };
    }

    const show = await Show.findById(booking.show._id || booking.show);
    const refund = await calculateRefundAmount(booking, show);

    if (!refund.eligible) {
      return {
        success: false,
        message: "Booking cannot be cancelled within 2 hours of show time.",
      };
    }

    let razorpayRefundId = `RFND-${Date.now()}`;
    if (booking.paymentId) {
      try {
        const razorpay = require("../../config/razorpay");
        const razorpayRefund = await razorpay.payments.refund(
          booking.paymentId,
          { amount: refund.refundAmount * 100 }
        );
        razorpayRefundId = razorpayRefund.id;
      } catch (rzErr) {
        console.error("Razorpay refund API error:", rzErr.message);
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
      io.to(booking.show._id.toString()).emit("seat-unlocked", {
        showId: booking.show._id,
        seats: booking.seats,
      });
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

const getBookingHistoryTool = async (userId) => {
  try {
    return await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: [
          { path: "movie" },
          { path: "screen", populate: { path: "theatre" } },
        ],
      })
      .sort({ createdAt: -1 });
  } catch (err) {
    console.error("getBookingHistoryTool error:", err);
    return [];
  }
};

const getEligibleCancellationBookingsTool = async (userId) => {
  try {
    const bookings = await Booking.find({
      user: userId,
      bookingStatus: "booked",
      paymentStatus: { $in: ["paid", "completed"] },
    })
      .populate({
        path: "show",
        populate: [
          { path: "movie" },
          { path: "screen", populate: { path: "theatre" } },
        ],
      })
      .sort({ createdAt: -1 });

    const eligible = [];
    for (const booking of bookings) {
      if (!booking.show) continue;
      const refundInfo = await calculateRefundAmount(booking, booking.show);
      if (refundInfo.eligible) {
        eligible.push(booking);
      }
    }

    if (eligible.length === 0 && bookings.length > 0) {
      return bookings;
    }

    return eligible;
  } catch (err) {
    console.error("getEligibleCancellationBookingsTool error:", err);
    return [];
  }
};

const getRefundStatusTool = async (userId, bookingId) => {
  try {
    let query = { user: userId };
    const refundFilter = [
      { paymentStatus: "refunded" },
      { refundStatus: { $ne: null } },
      { refundId: { $ne: null } },
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
        populate: [
          { path: "movie" },
          { path: "screen", populate: { path: "theatre" } },
        ],
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
        const refundInfo = show
          ? await calculateRefundAmount(b, show)
          : { refundAmount: b.refundAmount || 0 };

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
          date: b.show?.date
            ? new Date(b.show.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : null,
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

const rescheduleBookingTool = async (userId, oldBookingId, newShowId) => {
  try {
    const booking = await Booking.findOne({ bookingId: oldBookingId });
    if (!booking)
      return { success: false, message: "Active booking details not found." };

    if (booking.user.toString() !== userId.toString()) {
      return { success: false, message: "Unauthorized reschedule request." };
    }

    if (booking.bookingStatus !== "booked") {
      return {
        success: false,
        message: "Only confirmed paid bookings can be rescheduled.",
      };
    }

    const oldShow = await Show.findById(booking.show);
    const refundInfo = await calculateRefundAmount(booking, oldShow);
    if (!refundInfo.eligible) {
      return {
        success: false,
        message: "Rescheduling is blocked within 2 hours of original showtime.",
      };
    }

    const newShow = await Show.findById(newShowId);
    if (!newShow || newShow.status !== "scheduled") {
      return { success: false, message: "Proposed showtime is not scheduled." };
    }

    const layout = await getSeatLayoutTool(newShowId);
    const available = layout.filter((s) => s.available);
    if (available.length < booking.seats.length) {
      return {
        success: false,
        message: "Proposed show has insufficient vacancy.",
      };
    }

    let newSeats = [];
    const needed = booking.seats.length;
    const exactMatches = available
      .filter((s) => booking.seats.includes(s.name))
      .map((s) => s.name);
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
      io.to(oldShowId.toString()).emit("seat-unlocked", {
        showId: oldShowId,
        seats: oldSeats,
      });
      io.to(newShowId.toString()).emit("seat-locked", {
        showId: newShowId,
        seats: newSeats,
      });
    } catch (e) {}

    return { success: true, booking };
  } catch (err) {
    console.error("rescheduleBookingTool error:", err);
    return { success: false, message: err.message };
  }
};

const retrieveUserPreferenceTool = async (userId, currentQuery = "") => {
  try {
    if (!userId) return null;

    const prefMatches = await retrievePreferences(userId, currentQuery);
    if (!prefMatches || !Array.isArray(prefMatches) || prefMatches.length === 0)
      return null;

    let genre = null;
    let language = null;
    let mood = null;

    const knownGenres = [
      "Action", "Adventure", "Animation", "Comedy", "Crime",
      "Documentary", "Drama", "Family", "Fantasy", "History",
      "Horror", "Music", "Mystery", "Romance", "Science Fiction",
      "Sci-Fi", "Thriller", "War", "Western",
    ];

    const knownLanguages = [
      "English", "Hindi", "Tamil", "Telugu", "Kannada",
      "Malayalam", "Spanish", "French",
    ];

    for (const match of prefMatches) {
      if (match.genre && !genre) genre = match.genre;
      if (match.language && !language) language = match.language;
      if (match.mood && !mood) mood = match.mood;

      const text = match.text || "";
      if (!genre) {
        for (const g of knownGenres) {
          if (new RegExp(`\\b${g}\\b`, "i").test(text)) {
            genre = g;
            break;
          }
        }
      }
      if (!language) {
        for (const l of knownLanguages) {
          if (new RegExp(`\\b${l}\\b`, "i").test(text)) {
            language = l;
            break;
          }
        }
      }
    }

    if (!genre && !language && !mood) return null;

    return { genre, language, mood };
  } catch (err) {
    console.error("retrieveUserPreferenceTool error:", err.message);
    return null;
  }
};

const recommendMoviesTool = async (userId, preferences = {}) => {
  try {
    const { genre, language, mood } = preferences || {};
    const filter = { isActive: true };

    if (genre) {
      filter.genres = { $in: [new RegExp(genre, "i")] };
    }
    if (language) {
      filter.language = new RegExp(language, "i");
    }
    if (mood) {
      const moodMap = {
        funny: "Comedy",
        scary: "Horror",
        thrilling: "Thriller",
        romantic: "Romance",
        family: "Family",
      };
      const mappedGenre = moodMap[mood.toLowerCase()];
      if (mappedGenre && !filter.genres) {
        filter.genres = { $in: [new RegExp(mappedGenre, "i")] };
      }
    }

    let movies = await Movie.find(filter).sort({ popularity: -1 }).limit(10);

    if (movies.length === 0 && genre && language) {
      movies = await Movie.find({
        isActive: true,
        genres: { $in: [new RegExp(genre, "i")] },
      })
        .sort({ popularity: -1 })
        .limit(10);
    }

    if (movies.length === 0) {
      movies = await Movie.find({ isActive: true })
        .sort({ popularity: -1 })
        .limit(10);
    }

    return movies;
  } catch (err) {
    console.error("recommendMoviesTool error:", err.message);
    return [];
  }
};

const saveUserPreferenceTool = async (
  userId,
  preferenceText,
  extractedMetadata = {}
) => {
  try {
    if (!userId || !preferenceText) return false;
    await storePreference(userId, preferenceText, extractedMetadata);
    return true;
  } catch (err) {
    console.error("saveUserPreferenceTool error:", err.message);
    return false;
  }
};

module.exports = {
  searchMovieTool,
  searchTrendingMoviesTool,
  getMovieTheatresTool,
  searchAvailableDatesTool,
  searchShowTimesTool,
  getSeatLayoutTool,
  reserveSeatsTool,
  cancelBookingTool,
  getBookingHistoryTool,
  getEligibleCancellationBookingsTool,
  getRefundStatusTool,
  rescheduleBookingTool,
  recommendMoviesTool,
  retrieveUserPreferenceTool,
  saveUserPreferenceTool,
  GeneralChatTool,
  normalizeDate,
};
