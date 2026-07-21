const { StateGraph, END } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const AgentState = require("./state");
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
  getRefundStatusTool,
  rescheduleBookingTool,
  recommendMoviesTool,
  saveUserPreferenceTool,
} = require("./tools/backendTools");

// Initialize Gemini LLM
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

// ==========================================
// NODE 1: Intent Detection Node
// ==========================================
const intentDetectNode = async (state) => {
  const { messages, pendingConfirmation } = state;
  const lastUserMsg = messages
    .filter((m) => m.role === "user")
    .pop()?.content || "";
  const msgLower = lastUserMsg.toLowerCase().trim();

  // Confirmation Workflow check for pending destructive actions (refund, cancellation, reschedule)
  const confirmationWords = ["yes", "confirm", "sure", "proceed", "yep", "ok", "okay", "ha", "do it"];
  const rejectionWords = ["no", "cancel", "stop", "nevermind", "dont", "don't"];

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

  // LLM Intent Classification
  let detectedIntent = "general_chat";
  try {
    const rawLLMResponse = await callLLM(INTENT_CLASSIFICATION_PROMPT, [
      { role: "user", content: lastUserMsg },
    ]);
    const cleaned = rawLLMResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.intent) {
      detectedIntent = parsed.intent;
    }
  } catch (err) {
    // Fallback intent classification regex
    if (msgLower.includes("cancel")) {
      detectedIntent = "cancellation";
    } else if (msgLower.includes("refund status") || msgLower.includes("check refund")) {
      detectedIntent = "refund_status";
    } else if (msgLower.includes("refund")) {
      detectedIntent = "refund";
    } else if (msgLower.includes("history") || msgLower.includes("my ticket") || msgLower.includes("my booking")) {
      detectedIntent = "booking_history";
    } else if (msgLower.includes("trending") || msgLower.includes("popular")) {
      detectedIntent = "trending_movies";
    } else if (msgLower.includes("recommend") || msgLower.includes("suggest")) {
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

  // Override if pending confirmation is active
  if (pendingConfirmation && !isRejected && !isConfirmed) {
    if (pendingConfirmation === "confirm_refund") detectedIntent = "refund";
    if (pendingConfirmation === "confirm_cancellation") detectedIntent = "cancellation";
  }

  return {
    intent: detectedIntent,
    pendingConfirmation: currentPendingConfirmation,
    confirmedAction,
  };
};

// ==========================================
// NODE 2: Entity Extraction Node (PURE FUNCTION)
// NO validation, NO business logic, NO DB queries, NO side effects
// ==========================================
const entityExtractNode = async (state) => {
  const { messages } = state;
  const lastUserMsg = messages
    .filter((m) => m.role === "user")
    .pop()?.content || "";

  let extracted = {};
  try {
    const rawLLMResponse = await callLLM(ENTITY_EXTRACTION_PROMPT, [
      { role: "user", content: lastUserMsg },
    ]);
    const cleaned = rawLLMResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    extracted = JSON.parse(cleaned);
  } catch (err) {
    // Basic regex fallbacks
    const idMatch = lastUserMsg.match(/CV-\d+/i);
    const bookingId = idMatch ? idMatch[0].toUpperCase() : null;
    const seatMatch = lastUserMsg.match(/(\d+)\s*(?:seat|ticket|person|people)/i);
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

  // Merge extracted entities with existing state
  return {
    movie: extracted.movie || state.movie,
    theatre: extracted.theatre || state.theatre,
    showDate: extracted.date || state.showDate,
    showTime: extracted.time || state.showTime,
    showId: state.showId,
    bookingId: extracted.bookingId || state.bookingId,
    genre: extracted.genre || state.genre,
    language: extracted.language || state.language,
    mood: extracted.mood || state.mood,
    location: extracted.location || state.location,
    seatCount: extracted.seatCount || state.seatCount || 1,
  };
};

// ==========================================
// NODE 3: Tool Router Node
// Scalable Handler Registry Architecture
// ==========================================

const intentHandlers = {
  /**
   * Expected Booking Flow:
   * Movie Search -> Movie Selection -> getMovieTheatresTool(movieId) -> Theatre Selection -> searchAvailableDatesTool(movieId, theatreId) -> Date Selection -> searchShowTimesTool(movieId, theatreId, date) -> Show Selection -> Frontend /booking/:showId
   */
  booking: async (state) => {
    const { movie, theatre, showDate, showId } = state;

    // Case A: Show Card already selected -> complete show selection flow
    if (showId) {
      return {
        status: "SHOW_SELECTED",
        data: { selectedShowId: showId },
      };
    }

    // Case B: Movie specified by user -> ALWAYS execute searchMovieTool(movie)
    if (movie) {
      const movies = await searchMovieTool(movie);
      const matchedMovie = movies.length > 0 ? movies[0] : null;
      const movieId = matchedMovie ? matchedMovie._id : movie;

      if (!theatre) {
        // Step 1: getMovieTheatresTool(movieId) - Query ONLY Show collection for active scheduled shows
        const movieTheatres = await getMovieTheatresTool(movieId);
        const theatreNames = movieTheatres.map((t) => t.name);

        return {
          status: "SELECT_THEATRE",
          data: {
            movies: movies,
            searchedMovie: matchedMovie ? matchedMovie.title : movie,
            theatres: theatreNames,
          },
        };
      }

      if (!showDate) {
        // Step 2: Available Dates Tool for selected movie & theatre from Show collection
        const availableDates = await searchAvailableDatesTool(movieId, theatre);
        return {
          status: "SELECT_DATE",
          data: { movie: matchedMovie ? matchedMovie.title : movie, theatre, availableDates },
        };
      }

      // Step 3: ShowTimes Tool for selected movie, theatre, & date
      const shows = await searchShowTimesTool(movieId, theatre, showDate);
      return {
        status: "SELECT_SHOWTIME",
        data: { movie: matchedMovie ? matchedMovie.title : movie, theatre, date: showDate, shows },
      };
    }

    // Case C: No movie specified -> searchMovieTool("") returns active catalog
    const movies = await searchMovieTool("");
    return {
      status: "SELECT_MOVIE",
      data: { movies },
    };
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
    const recommendations = await recommendMoviesTool(userId, { genre, language, mood });
    return {
      status: "RECOMMENDATIONS_FOUND",
      data: { candidates: recommendations },
    };
  },

  booking_history: async (state) => {
    const { userId } = state;
    const bookings = await getBookingHistoryTool(userId);
    return {
      status: "BOOKING_HISTORY_FOUND",
      data: { bookings },
    };
  },

  refund: async (state) => {
    const { userId, bookingId, confirmedAction } = state;
    if (!bookingId) {
      const bookings = await getBookingHistoryTool(userId);
      return {
        status: "SELECT_BOOKING_FOR_REFUND",
        data: { bookings, message: "Select a ticket booking to request a refund." },
      };
    }

    if (!confirmedAction) {
      return {
        status: "CONFIRM_REFUND_REQUESTED",
        pendingConfirmation: "confirm_refund",
        data: {
          bookingId,
          message: `Are you sure you want to cancel booking ${bookingId} and request a refund?`,
        },
      };
    }

    const cancelResult = await cancelBookingTool(userId, bookingId);
    return {
      status: cancelResult.success ? "REFUND_SUCCESS" : "REFUND_FAILED",
      data: cancelResult,
    };
  },

  cancellation: async (state) => {
    const { userId, bookingId, confirmedAction } = state;
    if (!bookingId) {
      const bookings = await getBookingHistoryTool(userId);
      return {
        status: "SELECT_BOOKING_FOR_CANCELLATION",
        data: { bookings, message: "Select a ticket booking to cancel." },
      };
    }

    if (!confirmedAction) {
      return {
        status: "CONFIRM_CANCELLATION_REQUESTED",
        pendingConfirmation: "confirm_cancellation",
        data: {
          bookingId,
          message: `Are you sure you want to cancel ticket ${bookingId}?`,
        },
      };
    }

    const cancelResult = await cancelBookingTool(userId, bookingId);
    return {
      status: cancelResult.success ? "CANCELLATION_SUCCESS" : "CANCELLATION_FAILED",
      data: cancelResult,
    };
  },

  refund_status: async (state) => {
    const { userId, bookingId } = state;
    if (!bookingId) {
      const bookings = await getBookingHistoryTool(userId);
      return {
        status: "SELECT_BOOKING_FOR_REFUND_STATUS",
        data: { bookings, message: "Select a booking to check refund status." },
      };
    }

    const refundStatus = await getRefundStatusTool(userId, bookingId);
    return {
      status: "REFUND_STATUS_FOUND",
      data: refundStatus,
    };
  },

  general_chat: async (state) => {
    return {
      status: "GENERAL_CHAT",
      data: {},
    };
  },
};

const toolRouterNode = async (state) => {
  const { intent, userId, movie } = state;

  // Post-processing preference persistence (separated from entity extraction)
  if (userId && movie) {
    try {
      await saveUserPreferenceTool(userId, `Interested in movie: ${movie}`);
    } catch (e) {}
  }

  const handler = intentHandlers[intent] || intentHandlers.general_chat;
  const result = await handler(state);

  return {
    status: result.status,
    data: result.data,
    pendingConfirmation: result.pendingConfirmation || null,
  };
};

// ==========================================
// NODE 4: Formatter Node
// Constructs UI Cards & Navigation Payload (NO hardcoded fake metadata)
// ==========================================
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

  if (data) {
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
    } else if (data.theatres && Array.isArray(data.theatres) && data.theatres.length > 0) {
      cards = data.theatres.map((tName) => ({
        cardType: "theatre_card",
        title: tName,
        movieTitle: movie || "Movie",
      }));
      reasoning = `Select a cinema showing ${movie || "your movie"}.`;
      chips = data.theatres.slice(0, 4).map((t) => ({
        label: t,
        query: `Show ${movie} at ${t}`,
      }));
    } else if (data.availableDates && Array.isArray(data.availableDates) && data.availableDates.length > 0) {
      chips = data.availableDates.map((d) => ({
        label: `${d.dayName} ${d.displayDate}`,
        query: `Book ${movie} on ${d.fullDate}`,
      }));
      reasoning = `Choose an available show date for ${movie || "the movie"}.`;
    } else if (data.shows && Array.isArray(data.shows) && data.shows.length > 0) {
      cards = data.shows.map((s) => ({
        cardType: "show_card",
        showId: s._id || s.id,
        movieId: s.movie?._id || s.movie,
        movieTitle: s.movie?.title || movie || null,
        poster: s.movie?.posterUrl || s.movie?.poster || null,
        format: s.screen?.screenType || null,
        theatreName: s.screen?.theatre?.name || null,
        city: s.screen?.theatre?.city || null,
        date: s.date ? new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : showDate || null,
        time: s.startTime || null,
        price: s.price || null,
      }));
      reasoning = `Found ${cards.length} available showtimes for ${movie || "your show"}.`;
    } else if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
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
      reasoning = `Recommended based on your preferences.`;
    } else if (data.bookings && Array.isArray(data.bookings) && data.bookings.length > 0) {
      cards = data.bookings.map((b) => ({
        cardType: "booking_card",
        bookingId: b.bookingId || b._id,
        movieTitle: b.show?.movie?.title || null,
        theatreName: b.show?.screen?.theatre?.name || null,
        date: b.show?.date ? new Date(b.show.date).toLocaleDateString() : null,
        time: b.show?.startTime || null,
        seats: Array.isArray(b.seats) ? b.seats.join(", ") : b.seats || null,
        status: b.bookingStatus || null,
        amount: b.totalAmount || null,
      }));
    }
  }

  // Complete Show Selection Flow: Navigation Payload for Frontend
  const targetShowId = state.showId || (data && data.selectedShowId);
  if (targetShowId) {
    actionRequired = {
      type: "navigate",
      payload: `/booking/${targetShowId}`,
      bookingId: targetShowId,
    };
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

// ==========================================
// NODE 5: Responder Node
// Generates natural conversational responses
// ==========================================
const responderNode = async (state) => {
  const { intent, status, sanitizedData, cards, reasoning, chips, actionRequired } = state;

  const systemPrompt = `
${ASSISTANT_SYSTEM_PROMPT}

Structured Context:
- Active Intent: ${intent || "general_chat"}
- Status: ${status || "None"}
- Data Context: ${JSON.stringify(sanitizedData, null, 2)}
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

// ==========================================
// Workflow Compilation: Linear Orchestration Layer
// ==========================================
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
