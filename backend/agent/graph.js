const { StateGraph, END } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const AgentState = require("./state");
const Movie = require("../models/Movie");
const {
  INTENT_CLASSIFICATION_PROMPT,
  ENTITY_EXTRACTION_PROMPT,
  ASSISTANT_SYSTEM_PROMPT,
} = require("./prompts");
const {
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
} = require("./tools/backendTools");
const { handleBookingWorkflow } = require("./bookingAgent");

let model = null;
const initModel = () => {
  if (process.env.GEMINI_API_KEY) {
    model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-3.5-flash",
      temperature: 0.1,
    });
  }
};
initModel();

const callLLM = async (systemPrompt, messages) => {
  if (!model) {
    throw new Error("Gemini API key not initialized");
  }
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "ai" : "human",
      content: m.content,
    })),
  ];
  const response = await model.invoke(formattedMessages);
  return response.content;
};

const intentDetectNode = async (state) => {
  const { messages, pendingConfirmation } = state;
  const lastUserMsg =
    messages.filter((m) => m.role === "user").pop()?.content || "";
  const msgLower = lastUserMsg.toLowerCase().trim();

  const confirmationWords = [
    "yes", "confirm", "sure", "proceed", "yep", "ok", "okay", "ha", "do it",
  ];
  const rejectionWords = ["no, keep", "no, don't", "keep ticket", "nevermind"];

  const isConfirmed = confirmationWords.some((w) => msgLower.includes(w));
  const isRejected = rejectionWords.some((w) => msgLower.includes(w));

  let confirmedAction = false;
  let currentPendingConfirmation = pendingConfirmation;

  if (pendingConfirmation) {
    if (isConfirmed) {
      confirmedAction = true;
      currentPendingConfirmation = null;
    } else if (isRejected) {
      confirmedAction = false;
      currentPendingConfirmation = null;
    }
  }

  let detectedIntent = null;

  if (
    msgLower.includes("yes, cancel") ||
    msgLower.includes("confirm cancellation")
  ) {
    detectedIntent = "cancellation";
    confirmedAction = true;
    currentPendingConfirmation = null;
  } else if (
    msgLower.includes("refund status") ||
    msgLower.includes("check refund") ||
    msgLower.includes("track refund") ||
    msgLower.includes("status of refund")
  ) {
    detectedIntent = "refund_status";
  } else if (msgLower.includes("refund") || msgLower.includes("money back")) {
    detectedIntent = "refund";
  }

  if (!detectedIntent) {
    try {
      const rawLLMResponse = await callLLM(INTENT_CLASSIFICATION_PROMPT, [
        { role: "user", content: lastUserMsg },
      ]);
      const cleaned = rawLLMResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.intent) {
        detectedIntent = parsed.intent;
      }
    } catch (err) {
      detectedIntent = "general_chat";
      if (msgLower.includes("cancel")) {
        detectedIntent = "cancellation";
      } else if (
        msgLower.includes("refund status") ||
        msgLower.includes("check refund")
      ) {
        detectedIntent = "refund_status";
      } else if (msgLower.includes("refund")) {
        detectedIntent = "refund";
      } else if (
        msgLower.includes("history") ||
        msgLower.includes("my ticket") ||
        msgLower.includes("my booking")
      ) {
        detectedIntent = "booking_history";
      } else if (
        msgLower.includes("trending") ||
        msgLower.includes("popular")
      ) {
        detectedIntent = "trending_movies";
      } else if (
        msgLower.includes("recommend") ||
        msgLower.includes("suggest")
      ) {
        detectedIntent = "recommendation";
      } else if (
        msgLower.includes("book") ||
        msgLower.includes("seat") ||
        msgLower.includes("showtime") ||
        msgLower.includes("ticket")
      ) {
        detectedIntent = "booking";
      }
    }
  }

  const isNonBookingIntent = [
    "cancellation",
    "refund",
    "refund_status",
    "trending_movies",
    "recommendation",
    "booking_history",
  ].includes(detectedIntent);

  if (!isNonBookingIntent) {
    if (
      msgLower.includes("confirm theatre") ||
      msgLower.includes("continue booking") ||
      (state.movie && state.intent === "booking" && state.status !== "RESERVED")
    ) {
      detectedIntent = "booking";
    }
  }

  if (pendingConfirmation) {
    if (pendingConfirmation === "confirm_refund") {
      detectedIntent = "refund";
      if (isConfirmed) confirmedAction = true;
    }
    if (pendingConfirmation === "confirm_cancellation") {
      detectedIntent = "cancellation";
      if (isConfirmed) confirmedAction = true;
    }
  }

  return {
    intent: detectedIntent,
    pendingConfirmation: currentPendingConfirmation,
    confirmedAction,
  };
};

const entityExtractNode = async (state) => {
  const { messages } = state;
  const lastUserMsg =
    messages.filter((m) => m.role === "user").pop()?.content || "";

  let extracted = {};
  try {
    const rawLLMResponse = await callLLM(ENTITY_EXTRACTION_PROMPT, [
      { role: "user", content: lastUserMsg },
    ]);
    const cleaned = rawLLMResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    extracted = JSON.parse(cleaned);
  } catch (err) {
    const idMatch = lastUserMsg.match(/CV-\d+/i);
    const bookingId = idMatch ? idMatch[0].toUpperCase() : null;
    const seatMatch = lastUserMsg.match(
      /(\d+)\s*(?:seat|ticket|person|people)/i
    );
    const seatCount = seatMatch ? parseInt(seatMatch[1]) : null;

    extracted = {
      movie: null,
      theatre: null,
      date: null,
      time: null,
      bookingId,
      genre: null,
      language: null,
      mood: null,
      location: null,
      seatCount,
    };
  }

  if (!extracted.seatCount) {
    const seatMatch = lastUserMsg.match(
      /\b([1-9]|10)\b\s*(?:seat|seats|ticket|tickets|person|people)?/i
    );
    if (seatMatch) {
      extracted.seatCount = parseInt(seatMatch[1]);
    }
  }

  if (!extracted.date) {
    const isoDateMatch = lastUserMsg.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (isoDateMatch) {
      extracted.date = isoDateMatch[1];
    }
  }

  if (!extracted.time) {
    const timeMatch = lastUserMsg.match(/\b([01]?\d|2[0-3]):[0-5]\d(?:\s*(?:AM|PM|am|pm))?\b/);
    if (timeMatch) {
      extracted.time = timeMatch[0];
    }
  }

  if (!extracted.movie) {
    try {
      const activeMovies = await Movie.find({ isActive: true }).select("title");
      for (const m of activeMovies) {
        const titleLower = m.title.toLowerCase();
        if (lastUserMsg.toLowerCase().includes(titleLower)) {
          extracted.movie = m.title;
          break;
        }
      }
    } catch (e) {}
  }

  const msgLower = lastUserMsg.toLowerCase();
  const preferencePhrases = [
    "i like", "i love", "my favourite", "my favorite", "my fav",
    "i prefer", "i enjoy", "i usually watch", "i only watch",
    "suggest", "recommend",
  ];

  const hasPreferenceExpression = preferencePhrases.some((phrase) =>
    msgLower.includes(phrase)
  );
  const isActionIntent =
    msgLower.includes("book") ||
    msgLower.includes("cancel") ||
    msgLower.includes("refund") ||
    msgLower.includes("history") ||
    msgLower.startsWith("show me") ||
    msgLower.startsWith("find theatres");

  let preferenceDetected = false;
  let preferenceText = null;

  if (hasPreferenceExpression && !isActionIntent) {
    preferenceDetected = true;
    preferenceText = `User Preference: ${lastUserMsg.trim()}`;
  } else if (
    state.intent === "recommendation" &&
    (extracted.genre || extracted.language || extracted.mood)
  ) {
    preferenceDetected = true;
    preferenceText = `User Preference: ${[extracted.genre, extracted.language, extracted.mood].filter(Boolean).join(", ")}`;
  }

  let extractedShowId = extracted.showId || null;
  if (!extractedShowId) {
    const showIdMatch = lastUserMsg.match(/\b([a-f0-9]{24})\b/i);
    if (showIdMatch) {
      extractedShowId = showIdMatch[1];
    }
  }

  const explicitSeatMatches = lastUserMsg.match(/\b([A-Z]\d{1,2})\b/g);
  const extractedSeats = extracted.selectedSeats || (explicitSeatMatches && explicitSeatMatches.length > 0 ? explicitSeatMatches : null);
  const finalSelectedSeats = extractedSeats || state.selectedSeats || [];

  return {
    movie: extracted.movie || state.movie,
    theatre: extracted.theatre || state.theatre,
    showDate: extracted.date || state.showDate,
    showTime: extracted.time || state.showTime,
    showId: extractedShowId || state.showId || null,
    bookingId: extracted.bookingId || state.bookingId,
    genre: extracted.genre || state.genre,
    language: extracted.language || state.language,
    mood: extracted.mood || state.mood,
    location: extracted.location || state.location,
    seatCount: (finalSelectedSeats && finalSelectedSeats.length > 0) ? finalSelectedSeats.length : (extracted.seatCount || state.seatCount || null),
    selectedSeats: finalSelectedSeats,
    preferenceDetected,
    preferenceText,
  };
};

const intentHandlers = {
  booking: async (state) => {
    return await handleBookingWorkflow(state);
  },

  trending_movies: async (state) => {
    const trendingMovies = await searchTrendingMoviesTool();
    return {
      status: "TRENDING_MOVIES_FOUND",
      data: { movies: trendingMovies },
    };
  },

  recommendation: async (state) => {
    const { userId, genre, language, mood } = state;
    const lastUserMsg =
      state.messages.filter((m) => m.role === "user").pop()?.content || "";

    const savedPrefs = await retrieveUserPreferenceTool(userId, lastUserMsg);

    const mergedGenre = genre || savedPrefs?.genre || null;
    const mergedLanguage = language || savedPrefs?.language || null;
    const mergedMood = mood || savedPrefs?.mood || null;

    let recommendationType = "FALLBACK";
    if (genre || language || mood) {
      recommendationType = "CURRENT_REQUEST";
    } else if (
      savedPrefs &&
      (savedPrefs.genre || savedPrefs.language || savedPrefs.mood)
    ) {
      recommendationType = "SAVED_PREFERENCES";
    }

    const mergedPreferences = {
      genre: mergedGenre,
      language: mergedLanguage,
      mood: mergedMood,
    };

    const recommendations = await recommendMoviesTool(
      userId,
      mergedPreferences
    );

    return {
      status: "RECOMMENDATIONS_FOUND",
      data: {
        candidates: recommendations,
        recommendationType,
        appliedPreferences: mergedPreferences,
      },
    };
  },

  booking_history: async (state) => {
    const bookings = await getBookingHistoryTool(state.userId);
    return {
      status: "BOOKING_HISTORY_FOUND",
      data: { bookings },
    };
  },

  refund: async (state) => {
    const { userId, bookingId, confirmedAction, movie } = state;

    if (bookingId && confirmedAction) {
      const cancelResult = await cancelBookingTool(userId, bookingId);
      return {
        status: cancelResult.success ? "REFUND_SUCCESS" : "REFUND_FAILED",
        data: cancelResult,
      };
    }

    if (bookingId && !confirmedAction) {
      return {
        status: "CONFIRM_REFUND_REQUESTED",
        pendingConfirmation: "confirm_refund",
        data: {
          bookingId,
          message: `Are you sure you want to cancel booking ${bookingId} and request a refund?`,
        },
      };
    }

    const eligibleBookings = await getEligibleCancellationBookingsTool(userId);

    if (!eligibleBookings || eligibleBookings.length === 0) {
      return {
        status: "NO_ELIGIBLE_BOOKINGS_FOR_REFUND",
        data: {
          bookings: [],
          message:
            "You don't have any upcoming paid bookings that are eligible for refund.",
        },
      };
    }

    let displayBookings = eligibleBookings;
    const cleanMovieTitle = movie
      ? movie
          .replace(
            /\b(my|the|a|movie|movies|film|films|ticket|tickets|for|today|tonight|refund|booking|cancel)\b/gi,
            ""
          )
          .trim()
      : "";

    if (cleanMovieTitle && cleanMovieTitle.length > 1) {
      const filtered = eligibleBookings.filter(
        (b) =>
          b.show?.movie?.title &&
          b.show.movie.title
            .toLowerCase()
            .includes(cleanMovieTitle.toLowerCase())
      );
      if (filtered.length > 0) {
        displayBookings = filtered;
      }
    }

    return {
      status: "SELECT_BOOKING_FOR_REFUND",
      data: {
        bookings: displayBookings,
        message: "Select an eligible booking to request a refund.",
      },
    };
  },

  cancellation: async (state) => {
    const { userId, bookingId, confirmedAction, movie } = state;

    if (bookingId && confirmedAction) {
      const cancelResult = await cancelBookingTool(userId, bookingId);
      return {
        status: cancelResult.success
          ? "CANCELLATION_SUCCESS"
          : "CANCELLATION_FAILED",
        data: cancelResult,
      };
    }

    if (bookingId && !confirmedAction) {
      return {
        status: "CONFIRM_CANCELLATION_REQUESTED",
        pendingConfirmation: "confirm_cancellation",
        data: {
          bookingId,
          message: `Are you sure you want to cancel ticket ${bookingId}?`,
        },
      };
    }

    const eligibleBookings = await getEligibleCancellationBookingsTool(userId);

    if (!eligibleBookings || eligibleBookings.length === 0) {
      return {
        status: "NO_ELIGIBLE_BOOKINGS_FOR_CANCELLATION",
        data: {
          bookings: [],
          message:
            "You don't have any upcoming paid bookings that are eligible for cancellation.",
        },
      };
    }

    let displayBookings = eligibleBookings;
    const cleanMovieTitle = movie
      ? movie
          .replace(
            /\b(my|the|a|movie|movies|film|films|ticket|tickets|for|today|tonight|refund|booking|cancel)\b/gi,
            ""
          )
          .trim()
      : "";

    if (cleanMovieTitle && cleanMovieTitle.length > 1) {
      const filtered = eligibleBookings.filter(
        (b) =>
          b.show?.movie?.title &&
          b.show.movie.title
            .toLowerCase()
            .includes(cleanMovieTitle.toLowerCase())
      );
      if (filtered.length > 0) {
        displayBookings = filtered;
      }
    }

    return {
      status: "SELECT_BOOKING_FOR_CANCELLATION",
      data: {
        bookings: displayBookings,
        message: "Select an eligible booking to cancel.",
      },
    };
  },

  refund_status: async (state) => {
    const refundStatus = await getRefundStatusTool(
      state.userId,
      state.bookingId
    );
    return {
      status: "REFUND_STATUS_FOUND",
      data: refundStatus,
    };
  },

  check_refund_status: async (state) => {
    const refundStatus = await getRefundStatusTool(
      state.userId,
      state.bookingId
    );
    return {
      status: "REFUND_STATUS_FOUND",
      data: refundStatus,
    };
  },

  general_chat: async (state) => {
    const platformInfo = GeneralChatTool();
    return {
      status: "GENERAL_CHAT",
      data: { platformInfo },
    };
  },
};

const toolRouterNode = async (state) => {
  const { intent, userId, preferenceDetected, preferenceText } = state;

  if (userId && preferenceDetected && preferenceText) {
    try {
      await saveUserPreferenceTool(userId, preferenceText);
    } catch (e) {}
  }

  const handler = intentHandlers[intent] || intentHandlers.general_chat;
  const result = await handler(state);

  const resetState = (intent !== "booking" || result.status === "RESERVED" || result.status === "BOOKING_CANCELLED");

  return {
    ...state,
    ...result,
    movie: resetState ? null : (result.movie !== undefined ? result.movie : state.movie),
    theatre: resetState ? null : (result.theatre !== undefined ? result.theatre : state.theatre),
    showDate: resetState ? null : (result.showDate !== undefined ? result.showDate : state.showDate),
    showTime: resetState ? null : (result.showTime !== undefined ? result.showTime : state.showTime),
    showId: resetState ? null : (result.showId !== undefined ? result.showId : state.showId),
    seatCount: resetState ? null : (result.seatCount !== undefined ? result.seatCount : state.seatCount),
    selectedSeats: resetState ? [] : (result.selectedSeats !== undefined ? result.selectedSeats : state.selectedSeats),
    status: result.status,
    data: result.data,
    pendingConfirmation: result.pendingConfirmation || null,
  };
};

const responseFormatterNode = async (state) => {
  const { intent, status, data, movie, showDate } = state;
  let cards = [];
  let reasoning = null;
  let chips = [
    { label: "Book Movie", query: "Book a movie ticket" },
    { label: "Trending Movies", query: "Show trending movies" },
    { label: "Recommended", query: "Recommend movies for me" },
    { label: "My Bookings", query: "Show my booking history" },
    { label: "Refund Status", query: "Check refund status" },
  ];
  let actionRequired = true;

  if (status === "CONFIRM_SINGLE_THEATRE") {
    reasoning = data?.message || `📍 ${data?.theatre}\nThis movie is available only at this theatre. Would you like to continue?`;
    cards = [
      {
        cardType: "confirmation_card",
        title: data?.theatre || "Cinema",
        message: `This movie is available only at ${data?.theatre || "this cinema"}. Would you like to continue?`,
        confirmQuery: `Confirm theatre ${data?.theatre}`,
        cancelQuery: "Cancel booking",
      },
    ];
    chips = [
      { label: "Continue Booking", query: `Confirm theatre ${data?.theatre}` },
      { label: "Cancel", query: "Cancel booking" },
    ];
    actionRequired = null;
  } else if (status === "BOOKING_CANCELLED") {
    reasoning = data?.message || "Booking cancelled.";
    cards = [];
    chips = [
      { label: "Book Movie", query: "Book a movie ticket" },
      { label: "Trending Movies", query: "Show trending movies" },
    ];
    actionRequired = null;
  } else if (status === "CONFIRM_CANCELLATION_REQUESTED") {
    const bId = data?.bookingId;
    reasoning = `Are you sure you want to cancel ticket ${bId}?`;
    cards = [
      {
        cardType: "confirmation_card",
        title: `Cancel Ticket ${bId}`,
        message: `Are you sure you want to cancel ticket ${bId}? This will initiate a refund.`,
        confirmQuery: `Yes, cancel booking ${bId}`,
        cancelQuery: "No, keep booking",
      },
    ];
    chips = [
      { label: "Yes, Cancel Ticket", query: `Yes, cancel booking ${bId}` },
      { label: "No, Keep Ticket", query: "No, keep booking" },
    ];
    actionRequired = null;
  } else if (status === "CANCELLATION_SUCCESS") {
    const refundAmt = data?.refundAmount || data?.data?.refundAmount || 0;
    const bId = data?.bookingId || data?.data?.bookingId || "your ticket";
    reasoning = `Ticket ${bId} has been cancelled successfully! 🎉\n\nYour refund of ₹${refundAmt} has been initiated and will be credited to your bank account within 3–5 business days. Thank you for using CineVerse! 🍿`;
    cards = [
      {
        cardType: "refund_card",
        bookingId: bId,
        movieTitle: data?.movieTitle || "Cancelled Ticket",
        refundAmount: refundAmt,
        status: "REFUND INITIATED",
        paymentStatus: "refunded",
        eligible: true,
      },
    ];
    chips = [
      { label: "Book Movie", query: "Book a movie ticket" },
      { label: "Check Refund Status", query: "Check refund status" },
      { label: "My Bookings", query: "Show my booking history" },
    ];
    actionRequired = null;
  } else if (status === "SELECT_SEAT_COUNT") {
    reasoning = data?.message || "How many seats would you like to book?";
    chips = [
      { label: "1", query: "1 seat" },
      { label: "2", query: "2 seats" },
      { label: "3", query: "3 seats" },
      { label: "4", query: "4 seats" },
      { label: "5", query: "5 seats" },
    ];
    actionRequired = null;
  } else if (status === "SELECT_SEATS" && data?.seats) {
    cards = [
      {
        cardType: "seat_layout_card",
        showId: data.showId,
        movieTitle: data.movie || movie || "Movie",
        theatreName: data.theatre || "Cinema",
        date: data.date,
        time: data.showTime,
        seatCount: data.seatCount || 1,
        seats: data.seats,
      },
    ];
    reasoning = data.message || `Please select ${data.seatCount || 1} seat(s) below to continue.`;
    actionRequired = null;
  } else if (status === "RESERVED") {
    const bookingId = data?.bookingId || data?.booking?.bookingId || data?.booking?._id;
    reasoning =
      data?.message ||
      "Perfect! 🎉\n\nYour selected seats have been reserved temporarily.\n\nRedirecting you to the payment page...";
    actionRequired = {
      type: "navigate",
      payload: "/checkout",
      bookingId: bookingId,
    };
  } else if (status === "BOOKING_UPDATED") {
    reasoning =
      data?.message ||
      "Perfect! Your booking details have been updated. Please continue by selecting your seats on the booking page.";
    actionRequired = null;
  } else if (data) {
    if (data.movies && Array.isArray(data.movies) && data.movies.length > 0) {
      cards = data.movies.map((m) => ({
        cardType: "movie_card",
        movieId: m.tmdbId || m._id || m.id,
        tmdbId: m.tmdbId || m._id || m.id,
        title: m.title,
        poster: m.posterUrl || m.poster || null,
        genre: Array.isArray(m.genres) ? m.genres.join(", ") : m.genre || null,
        language: m.language || null,
        rating: m.rating ?? null,
        runtime: m.runtime ? `${m.runtime} min` : null,
        overview: m.overview || null,
      }));
      reasoning = `Found ${cards.length} movie(s) playing at CineVerse.`;
      chips = cards.slice(0, 4).map((c) => ({
        label: c.title,
        query: `Book ${c.title}`,
      }));
    } else if (
      data.theatres &&
      Array.isArray(data.theatres) &&
      data.theatres.length > 0
    ) {
      cards = data.theatres.map((tName) => ({
        cardType: "theatre_card",
        title: tName,
        movieTitle: movie || "Movie",
      }));
      reasoning =
        data.message ||
        (data.theatres.length === 1
          ? `Currently, this movie is available only at ${data.theatres[0]}.`
          : `Select a cinema showing ${movie || "your movie"}.`);
      chips = data.theatres.slice(0, 4).map((t) => ({
        label: t,
        query: `Show ${movie} at ${t}`,
      }));
    } else if (
      data.availableDates &&
      Array.isArray(data.availableDates) &&
      data.availableDates.length > 0
    ) {
      chips = data.availableDates.map((d) => ({
        label: `${d.dayName} ${d.displayDate}`,
        query: `Book ${movie} on ${d.fullDate}`,
      }));
      reasoning = data.message || `Choose an available show date for ${movie || "the movie"}.`;
    } else if (
      data.shows &&
      Array.isArray(data.shows) &&
      data.shows.length > 0
    ) {
      cards = data.shows.map((s) => ({
        cardType: "show_card",
        showId: s._id || s.id,
        movieId: s.movie?._id || s.movie,
        movieTitle: s.movie?.title || movie || null,
        poster: s.movie?.posterUrl || s.movie?.poster || null,
        format: s.screen?.screenType || null,
        theatreName: s.screen?.theatre?.name || null,
        city: s.screen?.theatre?.city || null,
        date: s.date
          ? new Date(s.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : showDate || null,
        time: s.startTime || null,
        price: s.price || null,
      }));
      reasoning = `Found ${cards.length} available showtimes for ${movie || "your show"}.`;
    } else if (
      data.candidates &&
      Array.isArray(data.candidates) &&
      data.candidates.length > 0
    ) {
      cards = data.candidates.map((m) => ({
        cardType: "movie_card",
        movieId: m.tmdbId || m._id || m.id,
        tmdbId: m.tmdbId || m._id || m.id,
        title: m.title,
        poster: m.posterUrl || m.poster || null,
        genre: Array.isArray(m.genres) ? m.genres.join(", ") : m.genre || null,
        language: m.language || null,
        rating: m.rating ?? null,
        overview: m.overview || null,
      }));

      if (data.recommendationType === "SAVED_PREFERENCES") {
        reasoning = "Recommended using your saved preferences.";
      } else if (data.recommendationType === "CURRENT_REQUEST") {
        reasoning = "Recommended using your current request.";
      } else {
        reasoning =
          "Showing popular movies because no preferences were found.";
      }
    } else if (data.refundBookings && Array.isArray(data.refundBookings)) {
      const count = data.refundBookings.length;
      if (count > 1) {
        reasoning = `I found ${count} refund requests. Select one below to view its current refund status.`;
      } else if (count === 1) {
        reasoning = `I found your refund request. Select it below to view its latest status.`;
      } else {
        reasoning = `You don't have any refund requests yet.`;
      }

      cards = data.refundBookings.map((r) => ({
        cardType: "refund_card",
        bookingId: r.bookingId,
        movieTitle: r.movieTitle,
        poster: r.poster,
        theatreName: r.theatreName,
        date: r.date,
        time: r.time,
        seats: r.seats,
        refundAmount: r.refundAmount,
        totalAmount: r.totalAmount,
        status: r.refundStatus,
        paymentStatus: r.paymentStatus,
        eligible: r.eligible,
      }));
    } else if (data.bookings && Array.isArray(data.bookings)) {
      if (data.bookings.length > 0) {
        cards = data.bookings.map((b) => ({
          cardType: "booking_card",
          bookingId: b.bookingId || b._id,
          movieTitle: b.show?.movie?.title || null,
          theatreName: b.show?.screen?.theatre?.name || null,
          date: b.show?.date
            ? new Date(b.show.date).toLocaleDateString()
            : null,
          time: b.show?.startTime || null,
          seats: Array.isArray(b.seats) ? b.seats.join(", ") : b.seats || null,
          status: b.bookingStatus || null,
          amount: b.totalAmount || null,
        }));
        reasoning =
          data.message || `Found ${cards.length} eligible booking(s).`;
      } else {
        cards = [];
        reasoning =
          data.message ||
          "You don't have any upcoming paid bookings that are eligible for refund.";
      }
    }
  }

  if (data?.message && !reasoning) {
    reasoning = data.message;
  }

  const targetShowId = state.showId || (data && data.selectedShowId);
  if (targetShowId && status === "SHOW_SELECTED") {
    actionRequired = {
      type: "navigate",
      payload: `/booking/${targetShowId}`,
      bookingId: targetShowId,
    };
  } else if (
    status === "BOOKING_UPDATED" ||
    status === "SELECT_SEAT_COUNT" ||
    status === "SELECT_SEATS" ||
    status === "CONFIRM_SINGLE_THEATRE" ||
    status === "BOOKING_CANCELLED"
  ) {
    actionRequired = null;
  }

  const sanitizedData = data ? JSON.parse(JSON.stringify(data)) : null;

  return {
    sanitizedData,
    cards,
    reasoning,
    chips,
    actionRequired,
  };
};

const responderNode = async (state) => {
  const { intent, status, sanitizedData, cards, reasoning, chips, actionRequired } =
    state;

  if (
    (status === "NO_ELIGIBLE_BOOKINGS_FOR_REFUND" ||
      status === "NO_ELIGIBLE_BOOKINGS_FOR_CANCELLATION" ||
      status === "SELECT_BOOKING_FOR_REFUND" ||
      status === "SELECT_BOOKING_FOR_CANCELLATION" ||
      status === "SELECT_SEAT_COUNT" ||
      status === "SELECT_SEATS" ||
      status === "CONFIRM_SINGLE_THEATRE" ||
      status === "BOOKING_CANCELLED" ||
      status === "RESERVED" ||
      status === "BOOKING_UPDATED" ||
      status === "SELECT_THEATRE" ||
      status === "INVALID_THEATRE" ||
      status === "NO_THEATRES_FOUND" ||
      status === "SELECT_DATE" ||
      status === "SELECT_SHOWTIME" ||
      intent === "check_refund_status" ||
      intent === "refund_status") &&
    reasoning
  ) {
    return {
      messages: [{ role: "assistant", content: reasoning }],
      cards: cards || [],
      reasoning,
      chips: chips || [],
      actionRequired,
    };
  }

  const systemPrompt = `
${ASSISTANT_SYSTEM_PROMPT}

Structured Context:
- Active Intent: ${intent || "general_chat"}
- Status: ${status || "None"}
- Data Context: ${JSON.stringify(sanitizedData, null, 2)}

Instructions for General Chat:
- If the user asks a CineVerse platform-specific question (e.g., cancellation policy, refund rates, payment options, seat locking duration, ticket QR rules, check-in policies, or AI assistant capabilities), answer STRICTLY using the structured information in Data Context under 'platformInfo'.
- If the question is about general cinema or world knowledge (e.g., "What is IMAX?", "Who directed Inception?"), answer using your general knowledge.
`;

  try {
    const lastUserMessage = state.messages
      .filter((m) => m.role === "user")
      .pop() || { role: "user", content: "" };

    const reply = await callLLM(systemPrompt, [lastUserMessage]);
    return {
      messages: [{ role: "assistant", content: reply }],
      cards: cards || [],
      reasoning: reasoning || null,
      chips: chips || [],
      actionRequired,
    };
  } catch (err) {
    return {
      messages: [
        {
          role: "assistant",
          content:
            reasoning ||
            "Here are the details for your request. Select your preferred choice from the cards below to continue.",
        },
      ],
      cards: cards || [],
      reasoning: reasoning || null,
      chips: chips || [],
      actionRequired,
    };
  }
};

const workflow = new StateGraph(AgentState)
  .addNode("intentDetect", intentDetectNode)
  .addNode("entityExtract", entityExtractNode)
  .addNode("toolRouter", toolRouterNode)
  .addNode("formatter", responseFormatterNode)
  .addNode("responder", responderNode);

workflow.addEdge("__start__", "intentDetect");
workflow.addEdge("intentDetect", "entityExtract");
workflow.addEdge("entityExtract", "toolRouter");
workflow.addEdge("toolRouter", "formatter");
workflow.addEdge("formatter", "responder");
workflow.addEdge("responder", END);

const graph = workflow.compile();

module.exports = graph;
