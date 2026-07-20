const { StateGraph, END } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const AgentState = require("./state");
const Movie = require("../models/Movie");
const { ROUTER_SYSTEM_PROMPT, ASSISTANT_SYSTEM_PROMPT } = require("./prompts");
const { storePreference, retrievePreferences } = require("./rag/pinecone");
const {
  searchMovieTool,
  searchNearbyTheatresTool,
  findShowsTool,
  getSeatLayoutTool,
  reserveSeatsTool,
  cancelBookingTool,
  getBookingHistoryTool,
  rescheduleBookingTool,
} = require("./tools/backendTools");
const Booking = require("../models/bookings");
const Payment = require("../models/Payment");
const razorpay = require("../config/razorpay");
const { lockSeat, unlockSeat } = require("../services/seatLockService");

// Initialize LLM
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
    throw new Error("Gemini model not initialized");
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

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseNaturalDate = (dateStr) => {
  if (!dateStr) return null;
  const s = dateStr.toLowerCase().trim();
  const now = new Date();
  const currentYear = now.getFullYear();

  if (s === "today") return formatLocalDate(now);
  if (s === "tomorrow") {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return formatLocalDate(t);
  }

  const monthNames = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  const match1 = s.match(/^(\d{1,2})\s+(\w+)$/);
  if (match1) {
    const day = parseInt(match1[1]);
    const monthKey = match1[2].toLowerCase();
    if (monthNames[monthKey] !== undefined) {
      const month = monthNames[monthKey];
      const d = new Date(currentYear, month, day);
      if (d < now) d.setFullYear(currentYear + 1);
      return formatLocalDate(d);
    }
  }

  const match2 = s.match(/^(\w+)\s+(\d{1,2})$/);
  if (match2) {
    const monthKey = match2[1].toLowerCase();
    const day = parseInt(match2[2]);
    if (monthNames[monthKey] !== undefined) {
      const month = monthNames[monthKey];
      const d = new Date(currentYear, month, day);
      if (d < now) d.setFullYear(currentYear + 1);
      return formatLocalDate(d);
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    if (parsed.getFullYear() < 2020) parsed.setFullYear(currentYear);
    return formatLocalDate(parsed);
  }

  return null;
};

const findNearbySeats = (layout, seatName, limit = 3) => {
  const row = seatName.charAt(0);
  const num = parseInt(seatName.slice(1));
  const available = layout.filter((s) => s.available);
  return available
    .map((s) => {
      const sRow = s.name.charAt(0);
      const sNum = parseInt(s.name.slice(1));
      const rowDist = Math.abs(sRow.charCodeAt(0) - row.charCodeAt(0));
      const colDist = Math.abs(sNum - num);
      const dist = rowDist * 10 + colDist;
      return { seat: s.name, dist };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((item) => item.seat);
};

const resolvePendingAction = (state, lastMsg) => {
  const msgLower = lastMsg.toLowerCase().trim();
  const confirmationWords = [
    "yes",
    "confirm",
    "reserve",
    "book",
    "sure",
    "ha",
    "okay",
    "go ahead",
    "yep",
    "yup",
    "ok",
    "fine",
    "that works",
    "that one",
    "tomorrow works",
    "first one",
    "second one",
  ];
  const rejectionWords = [
    "no",
    "cancel",
    "stop",
    "nevermind",
    "no thanks",
    "nope",
    "nay",
  ];

  const isConfirmed = confirmationWords.some((w) => msgLower.includes(w));
  const isRejected = rejectionWords.some((w) => msgLower.includes(w));

  const updates = {};

  if (!state.pendingAction) return null;

  if (
    state.pendingAction === "confirmAlternativeTheatre" &&
    state.pendingOptions?.theatre
  ) {
    if (isConfirmed) {
      updates.theatre = state.pendingOptions.theatre;
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    } else if (isRejected) {
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  } else if (
    state.pendingAction === "confirmAlternativeDate" &&
    state.pendingOptions?.date
  ) {
    if (isConfirmed) {
      updates.showDate = state.pendingOptions.date;
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    } else if (isRejected) {
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  } else if (
    state.pendingAction === "confirmAlternativeShow" &&
    state.pendingOptions?.showId
  ) {
    if (isConfirmed) {
      updates.showId = state.pendingOptions.showId;
      if (state.pendingOptions.startTime) {
        updates.showTime = state.pendingOptions.startTime;
      }
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    } else if (isRejected) {
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  } else if (state.pendingAction === "confirmSeatReservation") {
    if (isConfirmed) {
      updates.intent = "booking";
      updates.status = "SEAT_CONFIRMED";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    } else if (isRejected) {
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  } else if (state.pendingAction === "selectSeats") {
    const seatRegex = /\b[a-zA-Z]\d+\b/g;
    const matches = msgLower.match(seatRegex);
    if (matches && matches.length > 0) {
      updates.selectedSeats = matches.map((s) => s.toUpperCase());
      updates.seatCount = matches.length;
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  } else if (state.pendingAction === "confirmBooking") {
    if (isConfirmed) {
      updates.status = "CREATE_PAYMENT_ORDER";
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    } else if (isRejected) {
      updates.status = "BOOKING_CANCELLED";
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  } else if (
    state.pendingAction === "selectAlternativeTheatre" &&
    state.pendingOptions?.theatres?.length > 0
  ) {
    let choiceIdx = -1;
    if (isConfirmed && state.pendingOptions.theatres.length === 1) {
      choiceIdx = 0;
    } else if (
      msgLower.includes("first") ||
      msgLower.includes(" 1") ||
      msgLower === "1" ||
      msgLower.includes("one")
    ) {
      choiceIdx = 0;
    } else if (
      msgLower.includes("second") ||
      msgLower.includes(" 2") ||
      msgLower === "2" ||
      msgLower.includes("two")
    ) {
      choiceIdx = 1;
    } else if (
      msgLower.includes("third") ||
      msgLower.includes(" 3") ||
      msgLower === "3" ||
      msgLower.includes("three")
    ) {
      choiceIdx = 2;
    }

    if (choiceIdx === -1) {
      for (let i = 0; i < state.pendingOptions.theatres.length; i++) {
        if (msgLower.includes(state.pendingOptions.theatres[i].toLowerCase())) {
          choiceIdx = i;
          break;
        }
      }
    }

    if (choiceIdx >= 0 && choiceIdx < state.pendingOptions.theatres.length) {
      updates.theatre = state.pendingOptions.theatres[choiceIdx];
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  } else if (
    state.pendingAction === "selectAlternativeDate" &&
    state.pendingOptions?.dates?.length > 0
  ) {
    let choiceIdx = -1;
    if (isConfirmed && state.pendingOptions.dates.length === 1) {
      choiceIdx = 0;
    } else if (
      msgLower.includes("first") ||
      msgLower.includes(" 1") ||
      msgLower === "1" ||
      msgLower.includes("one")
    ) {
      choiceIdx = 0;
    } else if (
      msgLower.includes("second") ||
      msgLower.includes(" 2") ||
      msgLower === "2" ||
      msgLower.includes("two")
    ) {
      choiceIdx = 1;
    } else if (
      msgLower.includes("third") ||
      msgLower.includes(" 3") ||
      msgLower === "3" ||
      msgLower.includes("three")
    ) {
      choiceIdx = 2;
    }

    if (choiceIdx === -1) {
      for (let i = 0; i < state.pendingOptions.dates.length; i++) {
        if (msgLower.includes(state.pendingOptions.dates[i].toLowerCase())) {
          choiceIdx = i;
          break;
        }
      }
    }

    if (choiceIdx >= 0 && choiceIdx < state.pendingOptions.dates.length) {
      updates.showDate = state.pendingOptions.dates[choiceIdx];
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  } else if (
    state.pendingAction === "selectAlternativeShow" &&
    state.pendingOptions?.timings?.length > 0
  ) {
    let choiceIdx = -1;
    if (isConfirmed && state.pendingOptions.timings.length === 1) {
      choiceIdx = 0;
    } else if (
      msgLower.includes("first") ||
      msgLower.includes(" 1") ||
      msgLower === "1" ||
      msgLower.includes("one")
    ) {
      choiceIdx = 0;
    } else if (
      msgLower.includes("second") ||
      msgLower.includes(" 2") ||
      msgLower === "2" ||
      msgLower.includes("two")
    ) {
      choiceIdx = 1;
    } else if (
      msgLower.includes("third") ||
      msgLower.includes(" 3") ||
      msgLower === "3" ||
      msgLower.includes("three")
    ) {
      choiceIdx = 2;
    }

    if (choiceIdx === -1) {
      for (let i = 0; i < state.pendingOptions.timings.length; i++) {
        if (msgLower.includes(state.pendingOptions.timings[i].toLowerCase())) {
          choiceIdx = i;
          break;
        }
      }
    }

    if (choiceIdx >= 0 && choiceIdx < state.pendingOptions.timings.length) {
      updates.showTime = state.pendingOptions.timings[choiceIdx];
      updates.intent = "booking";
      updates.pendingAction = null;
      updates.pendingOptions = null;
    }
  }

  if (Object.keys(updates).length > 0) {
    return updates;
  }
  return null;
};

const shouldResumePendingWorkflow = (msg, pendingAction, pendingOptions) => {
  if (!pendingAction) return false;
  const m = msg.toLowerCase().trim();
  const words = m.replace(/[^a-z0-9 ]/g, "").split(/\s+/);

  const resumeWords = [
    "continue",
    "resume",
    "yes",
    "proceed",
    "ok",
    "okay",
    "sure",
    "yep",
    "yup",
    "fine",
  ];
  const resumePhrases = [
    "go ahead",
    "that works",
    "okay continue",
    "sounds good",
  ];
  if (resumeWords.some((w) => words.includes(w))) return true;
  if (resumePhrases.some((p) => m.includes(p))) return true;

  if (
    pendingAction === "selectAlternativeTheatre" &&
    pendingOptions?.theatres
  ) {
    if (pendingOptions.theatres.some((t) => m.includes(t.toLowerCase())))
      return true;
  }
  if (pendingAction === "selectAlternativeDate" && pendingOptions?.dates) {
    if (pendingOptions.dates.some((d) => m.includes(d.toLowerCase())))
      return true;
  }
  if (pendingAction === "selectAlternativeShow" && pendingOptions?.timings) {
    if (pendingOptions.timings.some((t) => m.includes(t.toLowerCase())))
      return true;
  }
  if (pendingAction === "selectSeats") {
    const seatRegex = /\b[a-zA-Z]\d+\b/;
    if (seatRegex.test(m)) return true;
  }

  const numberWords = ["first", "second", "third", "one", "two", "three"];
  const numberDigits = ["1", "2", "3"];
  const hasOptions =
    pendingOptions?.theatres?.length > 0 ||
    pendingOptions?.dates?.length > 0 ||
    pendingOptions?.timings?.length > 0;
  if (
    hasOptions &&
    (numberWords.some((n) => words.includes(n)) ||
      numberDigits.some((n) => words.includes(n)))
  ) {
    return true;
  }

  return false;
};

const logTransition = (nodeName, state, extra = {}) => {
  console.log(`\n=== ${nodeName} ===`);
  console.log("  Intent:", state.intent || "None");
  console.log("  Status:", state.status || "None");
  console.log("  NextAction:", state.nextAction || "None");
  console.log("  PendingAction:", state.pendingAction || "None");
  console.log("  Movie:", state.movie || "None");
  console.log("  Theatre:", state.theatre || "None");
  console.log("  ShowDate:", state.showDate || "None");
  console.log("  ShowTime:", state.showTime || "None");
  console.log("  BookingId:", state.bookingId || "None");
  for (const [k, v] of Object.entries(extra)) {
    console.log(`  ${k}:`, v);
  }
  console.log("===");
};

const logMutation = (field, oldVal, newVal) => {
  if (oldVal !== newVal && (oldVal || newVal)) {
    console.log(`  [MUTATION] ${field}: "${oldVal}" → "${newVal}"`);
  }
};

const detectStrongIntent = (msgLower) => {
  if (msgLower.includes("cancel")) return "cancellation";
  if (msgLower.includes("reschedule") || msgLower.includes("change show"))
    return "reschedule";
  if (msgLower.includes("refund")) return "refund";
  if (
    msgLower.includes("history") ||
    msgLower.includes("my ticket") ||
    msgLower.includes("my booking")
  )
    return "booking_history";
  if (msgLower.includes("recommend") || msgLower.includes("suggest"))
    return "recommendation";
  const cleaned = msgLower.replace(/[^a-z ]/g, "").trim();
  if (
    [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good evening",
      "greetings",
    ].includes(cleaned)
  )
    return "greeting";
  if (msgLower.includes("help") || msgLower.includes("faq"))
    return "general_chat";
  return null;
};

// Intent Detection Node
const intentDetectNode = async (state) => {
  const { messages } = state;
  const lastMsg = messages[messages.length - 1]?.content || "";
  const msgLower = lastMsg.toLowerCase().trim();

  const hasPendingAction = !!state.pendingAction;
  let isStale = false;
  if (hasPendingAction && !state.movie && !state.bookingId) {
    isStale = true;
  }

  const strongIntent = detectStrongIntent(msgLower);
  const isGreeting = strongIntent === "greeting";
  const willResume = shouldResumePendingWorkflow(
    lastMsg,
    state.pendingAction,
    state.pendingOptions,
  );

  logTransition("intentDetectNode", state, {
    "User Message": lastMsg,
    "Strong Intent": strongIntent || "None",
    "Is Greeting": isGreeting,
    "Has Pending": hasPendingAction,
    "Is Stale": isStale,
    "Will Resume": willResume,
  });

  // STEP 1: Clear stale pending actions
  let stateUpdates = {};
  if (isStale) {
    console.log(
      "  [CLEANUP] Clearing stale pendingAction:",
      state.pendingAction,
    );
    stateUpdates.pendingAction = null;
    stateUpdates.pendingOptions = null;
  }

  // STEP 2: Greetings — highest priority
  if (isGreeting) {
    return {
      ...stateUpdates,
      intent: "general_chat",
      status:
        hasPendingAction && !isStale ? "PENDING_WORKFLOW_PAUSED" : "GREETING",
      pendingAction: hasPendingAction && !isStale ? state.pendingAction : null,
      pendingOptions:
        hasPendingAction && !isStale ? state.pendingOptions : null,
    };
  }

  // STEP 3: Strong new intent overrides pending workflow
  if (
    hasPendingAction &&
    !isStale &&
    strongIntent &&
    strongIntent !== "greeting"
  ) {
    console.log(
      "  [OVERRIDE] Strong intent",
      strongIntent,
      "cancels pending:",
      state.pendingAction,
    );
    stateUpdates.pendingAction = null;
    stateUpdates.pendingOptions = null;
    return {
      ...stateUpdates,
      intent: strongIntent,
    };
  }

  // STEP 4: Pending action resolution — only for confirmations/answers
  if (hasPendingAction && !isStale && willResume) {
    const pendingUpdates = resolvePendingAction(state, lastMsg);
    if (pendingUpdates) {
      for (const field of [
        "movie",
        "theatre",
        "showDate",
        "showTime",
        "bookingId",
      ]) {
        if (pendingUpdates[field] !== undefined) {
          logMutation(field, state[field], pendingUpdates[field]);
        }
      }
      return {
        ...stateUpdates,
        ...pendingUpdates,
      };
    }
    return {
      ...stateUpdates,
      intent: "booking",
    };
  }

  // STEP 5: If pending action exists but message is unrelated, re-run intent detection
  // (Don't auto-resume — fall through to LLM router)

  let routerData = null;
  try {
    const routerResponseText = await callLLM(ROUTER_SYSTEM_PROMPT, messages);
    const cleanedJson = routerResponseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    routerData = JSON.parse(cleanedJson);
  } catch (err) {
    console.error("Intent parsing LLM error, executing local fallback:", err);
  }

  if (!routerData) {
    let intent = null;

    if (msgLower.includes("cancel")) {
      intent = "cancellation";
    } else if (
      msgLower.includes("reschedule") ||
      msgLower.includes("change show")
    ) {
      intent = "reschedule";
    } else if (msgLower.includes("refund")) {
      intent = "refund";
    } else if (msgLower.includes("history") || msgLower.includes("my ticket")) {
      intent = "booking_history";
    } else if (
      msgLower.includes("book") ||
      msgLower.includes("seat") ||
      msgLower.includes("ticket") ||
      msgLower.includes("obsession") ||
      msgLower.includes("toy story") ||
      msgLower.includes("moana") ||
      msgLower.includes("cocktail") ||
      msgLower.includes("disclosure")
    ) {
      intent = "booking";
    } else if (
      msgLower.includes("recommend") ||
      msgLower.includes("suggest") ||
      msgLower.includes("watch")
    ) {
      intent = "recommendation";
    }

    if (!intent) {
      if (state.intent && state.intent !== "general_chat") {
        intent = state.intent;
      } else {
        intent = "general_chat";
      }
    }

    const idMatch = lastMsg.match(/CV-\d+/i);
    const bookingId = idMatch ? idMatch[0].toUpperCase() : null;

    const seatMatch = lastMsg.match(/(\d+)\s*(?:seat|ticket|person|people)/i);
    const seatCount = seatMatch ? parseInt(seatMatch[1]) : 1;

    let movie = state.movie || null;
    let theatre = state.theatre || null;
    let date = state.showDate || null;
    let showTime = state.showTime || null;

    if (intent === "booking") {
      try {
        const dbMovies = await Movie.find({ isActive: true });
        for (const mv of dbMovies) {
          if (msgLower.includes(mv.title.toLowerCase())) {
            movie = mv.title;
            break;
          }
        }
      } catch (e) {}

      if (!movie && !state.movie) {
        // No movie found, will ask
      } else if (!theatre && !state.theatre) {
        theatre = lastMsg.trim();
      } else if (!date && !state.showDate) {
        date = lastMsg.trim();
      } else if (!showTime && !state.showTime) {
        showTime = lastMsg.trim();
      }
    }

    routerData = {
      intent,
      entities: {
        bookingId,
        seatCount,
        movie,
        date,
        theatre,
        showTime,
        genre: null,
        language: null,
        audience: null,
        mood: null,
        similarMovie: null,
      },
    };

    const similarRegex = /(?:similar to|like|movies like)\s+([a-zA-Z0-9\s:]+)/i;
    if (similarRegex.test(lastMsg)) {
      const match = lastMsg.match(similarRegex);
      routerData.entities.similarMovie = match[1].trim();
    }
  }

  // Parse date with proper year handling
  let resolvedDate = routerData.entities?.date || state.showDate;
  if (routerData.entities?.date) {
    const parsed = parseNaturalDate(routerData.entities.date);
    if (parsed) resolvedDate = parsed;
  }

  if (state.userId && routerData.entities?.movie) {
    try {
      await storePreference(
        state.userId,
        `Prefers movie: ${routerData.entities.movie}`,
      );
    } catch (e) {}
  }
  if (state.userId && routerData.entities?.theatre) {
    try {
      await storePreference(
        state.userId,
        `Prefers cinema: ${routerData.entities.theatre}`,
      );
    } catch (e) {}
  }

  const newIntent = routerData.intent || "general_chat";
  const isNewBookingIntent =
    newIntent === "booking" &&
    routerData.entities?.movie &&
    routerData.entities.movie !== state.movie;

  const finalMovie = routerData.entities?.movie || state.movie;
  const finalTheatre = isNewBookingIntent
    ? routerData.entities?.theatre || null
    : routerData.entities?.theatre || state.theatre;
  const finalDate = isNewBookingIntent
    ? resolvedDate
    : resolvedDate || state.showDate;
  const finalTime = isNewBookingIntent
    ? routerData.entities?.showTime || null
    : routerData.entities?.showTime || state.showTime;

  logMutation("movie", state.movie, finalMovie);
  logMutation("theatre", state.theatre, finalTheatre);
  logMutation("showDate", state.showDate, finalDate);
  logMutation("showTime", state.showTime, finalTime);

  // If a non-booking intent was detected, clear pending workflow
  if (
    newIntent !== "booking" &&
    newIntent !== "general_chat" &&
    hasPendingAction
  ) {
    stateUpdates.pendingAction = null;
    stateUpdates.pendingOptions = null;
  }

  return {
    ...stateUpdates,
    intent: newIntent,
    movie: finalMovie,
    theatre: finalTheatre,
    showDate: finalDate,
    showTime: finalTime,
    seatCount: routerData.entities?.seatCount || state.seatCount,
    bookingId: routerData.entities?.bookingId || state.bookingId,
    genre: routerData.entities?.genre || state.genre,
    language: routerData.entities?.language || state.language,
    audience: routerData.entities?.audience || state.audience,
    mood: routerData.entities?.mood || state.mood,
    similarMovie: routerData.entities?.similarMovie || state.similarMovie,
  };
};

// Booking Node
const bookingNode = async (state) => {
  const {
    movie,
    theatre,
    showDate,
    showTime,
    selectedSeats,
    seatCount,
    userId,
  } = state;
  logTransition("bookingNode", state);

  // If user cancelled, release seat locks and reset
  if (state.status === "BOOKING_CANCELLED") {
    if (selectedSeats && selectedSeats.length > 0 && state.showId) {
      for (const seat of selectedSeats) {
        await unlockSeat(state.showId, seat);
      }
    }
    return {
      status: "BOOKING_CANCELLED",
      nextAction: "SHOW_ERROR",
      data: {
        message: "Booking was cancelled. What else can I help you with?",
      },
      pendingAction: null,
      pendingOptions: null,
      selectedSeats: [],
      actionRequired: true,
    };
  }

  if (!movie) {
    return {
      status: "MOVIE_REQUIRED",
      nextAction: "ASK_MOVIE",
      data: {},
      pendingAction: null,
      pendingOptions: null,
      actionRequired: true,
    };
  }

  const movies = await searchMovieTool(movie);
  if (movies.length === 0) {
    const activeMovies = await Movie.find({ isActive: true })
      .sort({ popularity: -1 })
      .limit(3);
    return {
      status: "MOVIE_NOT_FOUND",
      nextAction: "SHOW_ALTERNATIVES",
      data: {
        requestedMovie: movie,
        suggestions: activeMovies.map((m) => m.title),
      },
      pendingAction: null,
      pendingOptions: null,
      actionRequired: true,
    };
  }

  const selectedMovie = movies[0];

  if (!theatre) {
    return {
      status: "THEATRE_REQUIRED",
      nextAction: "ASK_THEATRE",
      data: { selectedMovie: selectedMovie.title },
      pendingAction: null,
      pendingOptions: null,
      actionRequired: true,
    };
  }

  const theatres = await searchNearbyTheatresTool(theatre);
  if (theatres.length === 0) {
    const allActiveShows = await findShowsTool(selectedMovie._id, null);
    const uniqueTheatres = [
      ...new Set(
        allActiveShows.map((s) => s.screen?.theatre?.name).filter(Boolean),
      ),
    ];
    return {
      status: "THEATRE_NOT_FOUND",
      nextAction: "SHOW_ALTERNATIVES",
      data: {
        selectedMovie: selectedMovie.title,
        searchedTheatre: theatre,
        alternativeTheatres: uniqueTheatres,
      },
      actionRequired: true,
      pendingAction:
        uniqueTheatres.length > 0 ? "selectAlternativeTheatre" : null,
      pendingOptions:
        uniqueTheatres.length > 0 ? { theatres: uniqueTheatres } : null,
    };
  }

  const selectedTheatre = theatres[0];

  const dateStr = parseNaturalDate(showDate) || formatLocalDate(new Date());
  console.log("  [bookingNode] Resolved date:", showDate, "→", dateStr);

  const shows = await findShowsTool(selectedMovie._id, null);
  const matchingShows = shows.filter(
    (s) => s.screen?.theatre?._id.toString() === selectedTheatre._id.toString(),
  );

  if (matchingShows.length === 0) {
    const alternativeTheatres = [
      ...new Set(shows.map((s) => s.screen?.theatre?.name).filter(Boolean)),
    ];
    return {
      status: "MOVIE_NOT_PLAYING_AT_THEATRE",
      nextAction: "SHOW_ALTERNATIVES",
      data: {
        selectedMovie: selectedMovie.title,
        selectedTheatre: selectedTheatre.name,
        alternativeTheatres: alternativeTheatres,
      },
      actionRequired: true,
      pendingAction:
        alternativeTheatres.length > 0 ? "selectAlternativeTheatre" : null,
      pendingOptions:
        alternativeTheatres.length > 0
          ? { theatres: alternativeTheatres }
          : null,
    };
  }

  const targetShowsOnDate = matchingShows.filter((s) => {
    const showDateStr = formatLocalDate(new Date(s.date || s.createdAt));
    return showDateStr === dateStr;
  });

  if (targetShowsOnDate.length === 0) {
    const availableDates = [
      ...new Set(
        matchingShows.map((s) => {
          const showD = new Date(s.date || s.createdAt);
          return showD.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }),
      ),
    ];
    return {
      status: "SHOWS_ON_DATE_NOT_FOUND",
      nextAction: "SHOW_ALTERNATIVES",
      data: {
        selectedMovie: selectedMovie.title,
        selectedTheatre: selectedTheatre.name,
        targetDate: dateStr,
        availableDates: availableDates,
      },
      actionRequired: true,
      pendingAction: availableDates.length > 0 ? "selectAlternativeDate" : null,
      pendingOptions:
        availableDates.length > 0 ? { dates: availableDates } : null,
    };
  }

  // Showtime selection stage
  if (!showTime && targetShowsOnDate.length > 1) {
    const availableTimings = targetShowsOnDate.map((s) => s.startTime);
    return {
      status: "SHOWTIME_REQUIRED",
      nextAction: "ASK_SHOWTIME",
      data: {
        selectedMovie: selectedMovie.title,
        selectedTheatre: selectedTheatre.name,
        date: dateStr,
        availableTimings,
      },
      pendingAction: "selectAlternativeShow",
      pendingOptions: { timings: availableTimings },
      actionRequired: true,
    };
  }

  // Select target show
  let targetShow = targetShowsOnDate[0];
  if (showTime) {
    const matchedTime = targetShowsOnDate.find(
      (s) => s.startTime.includes(showTime) || showTime.includes(s.startTime),
    );
    if (matchedTime) {
      targetShow = matchedTime;
    } else {
      const availableTimings = targetShowsOnDate.map((s) => s.startTime);
      return {
        status: "TIME_MISMATCH",
        nextAction: "SHOW_ALTERNATIVES",
        data: {
          selectedMovie: selectedMovie.title,
          selectedTheatre: selectedTheatre.name,
          date: dateStr,
          searchedTime: showTime,
          availableTimings: availableTimings,
        },
        actionRequired: true,
        pendingAction: "selectAlternativeShow",
        pendingOptions: { timings: availableTimings },
      };
    }
  }

  // Seat Display / Selection Stage
  if (!selectedSeats || selectedSeats.length === 0) {
    const layout = await getSeatLayoutTool(targetShow._id);
    const available = layout.filter((s) => s.available).map((s) => s.name);
    return {
      showId: targetShow._id.toString(),
      showTime: targetShow.startTime,
      status: "PENDING_SELECTION",
      nextAction: "ASK_SEATS",
      data: {
        selectedMovie: selectedMovie.title,
        selectedTheatre: selectedTheatre.name,
        date: dateStr,
        showTime: targetShow.startTime,
        availableSeats: available,
      },
      pendingAction: "selectSeats",
      pendingOptions: { seats: available },
      actionRequired: true,
    };
  }

  // Create payment order stage (user confirmed booking summary)
  if (state.status === "CREATE_PAYMENT_ORDER") {
    const { calculateBookingPricing } = require("../services/pricingService");
    const pricing = await calculateBookingPricing(selectedSeats.length, targetShow.price);
    const { subtotal: totalTicketPrice, convenienceFee, gst, totalAmount: grandTotal } = pricing;

    const bookingId = `CV-${Date.now()}`;
    const booking = await Booking.create({
      user: userId,
      show: targetShow._id,
      seats: selectedSeats,
      subtotal: totalTicketPrice,
      convenienceFee,
      gst,
      totalAmount: grandTotal,
      bookingId,
      paymentStatus: "pending",
      bookingStatus: "pending",
      bookingExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute lock
    });

    const order = await razorpay.orders.create({
      amount: grandTotal * 100, // in paisa
      currency: "INR",
      receipt: bookingId,
    });

    booking.orderId = order.id;
    await booking.save();

    await Payment.create({
      booking: booking._id,
      user: userId,
      amount: grandTotal,
      razorpayOrderId: order.id,
      status: "pending",
    });

    return {
      bookingId: booking.bookingId,
      status: "PENDING_PAYMENT",
      nextAction: "WAIT_FOR_PAYMENT",
      data: {
        message: "Please complete the payment to confirm your booking.",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id.toString(),
      },
      actionRequired: {
        type: "navigate",
        payload: "/checkout",
        bookingId: booking._id.toString(),
      },
    };
  }

  // Verify and lock seats stage
  if (state.status !== "SEATS_LOCKED" && state.status !== "PENDING_PAYMENT") {
    const layout = await getSeatLayoutTool(targetShow._id);
    const unavailableSeats = [];
    for (const seat of selectedSeats) {
      const seatObj = layout.find((s) => s.name === seat);
      if (!seatObj || !seatObj.available) {
        unavailableSeats.push(seat);
      }
    }

    if (unavailableSeats.length > 0) {
      const suggestions = [];
      for (const seat of unavailableSeats) {
        suggestions.push(...findNearbySeats(layout, seat));
      }
      const uniqueSuggestions = [...new Set(suggestions)].filter(
        (s) => !selectedSeats.includes(s),
      );
      return {
        showId: targetShow._id.toString(),
        status: "SEATS_UNAVAILABLE",
        nextAction: "SHOW_ALTERNATIVES",
        data: {
          selectedMovie: selectedMovie.title,
          selectedTheatre: selectedTheatre.name,
          date: dateStr,
          showTime: targetShow.startTime,
          unavailableSeats,
          suggestions: uniqueSuggestions,
        },
        pendingAction: "selectSeats",
        pendingOptions: { seats: uniqueSuggestions },
        actionRequired: true,
        selectedSeats: [], // Reset selected seats so they can select again
      };
    }

    // Attempt Redis Seat Lock
    const lockedList = [];
    let lockFailed = false;
    for (const seat of selectedSeats) {
      const lockResult = await lockSeat(
        targetShow._id.toString(),
        seat,
        userId,
      );
      if (!lockResult.success) {
        lockFailed = true;
        break;
      }
      lockedList.push(seat);
    }

    if (lockFailed) {
      for (const ls of lockedList) {
        await unlockSeat(targetShow._id.toString(), ls);
      }
      const layout2 = await getSeatLayoutTool(targetShow._id);
      const suggestions = [];
      for (const seat of selectedSeats) {
        suggestions.push(...findNearbySeats(layout2, seat));
      }
      const uniqueSuggestions = [...new Set(suggestions)].filter(
        (s) => !selectedSeats.includes(s),
      );
      return {
        showId: targetShow._id.toString(),
        status: "SEATS_UNAVAILABLE",
        nextAction: "SHOW_ALTERNATIVES",
        data: {
          selectedMovie: selectedMovie.title,
          selectedTheatre: selectedTheatre.name,
          date: dateStr,
          showTime: targetShow.startTime,
          unavailableSeats: selectedSeats,
          suggestions: uniqueSuggestions,
        },
        pendingAction: "selectSeats",
        pendingOptions: { seats: uniqueSuggestions },
        actionRequired: true,
        selectedSeats: [],
      };
    }

    // Socket notify locked
    try {
      const io = getIO();
      io.to(targetShow._id.toString()).emit("seat-locked", {
        showId: targetShow._id,
        seats: selectedSeats,
        lockedBy: userId,
      });
    } catch (e) {}
  }

  // Display summary (SEATS_LOCKED)
  const { calculateBookingPricing } = require("../services/pricingService");
  const pricing = await calculateBookingPricing(selectedSeats.length, targetShow.price);
  const { subtotal: totalTicketPrice, convenienceFee, gst, totalAmount: grandTotal } = pricing;

  return {
    showId: targetShow._id.toString(),
    status: "SEATS_LOCKED",
    nextAction: "SHOW_BOOKING_SUMMARY",
    data: {
      movie: selectedMovie.title,
      theatre: selectedTheatre.name,
      date: dateStr,
      showtime: targetShow.startTime,
      seats: selectedSeats,
      ticketPrice,
      totalTicketPrice,
      convenienceFee,
      gst,
      grandTotal,
    },
    pendingAction: "confirmBooking",
    pendingOptions: { seats: selectedSeats },
    actionRequired: true,
  };
};

//  Cancellation Node
const cancellationNode = async (state) => {
  const { bookingId, userId } = state;

  if (!bookingId) {
    return {
      status: "CANCEL_BOOKING_ID_REQUIRED",
      nextAction: "ASK_BOOKING_ID",
      data: {},
      actionRequired: true,
    };
  }

  const result = await cancelBookingTool(userId, bookingId);
  if (result.success) {
    return {
      status: "CANCEL_SUCCESS",
      nextAction: "COMPLETE_CANCEL",
      data: {
        bookingId: bookingId,
        refundAmount: result.refundAmount,
        message: result.message,
      },
      actionRequired: true,
    };
  } else {
    return {
      status: "CANCEL_FAILED",
      nextAction: "SHOW_ERROR",
      data: { bookingId: bookingId, errorMessage: result.message },
      actionRequired: true,
    };
  }
};

// Refund Node
const refundNode = async (state) => {
  const { bookingId, userId } = state;

  if (!bookingId) {
    return {
      status: "REFUND_BOOKING_ID_REQUIRED",
      nextAction: "ASK_BOOKING_ID",
      data: {},
      actionRequired: true,
    };
  }

  const bookings = await getBookingHistoryTool(userId);
  const target = bookings.find((b) => b.bookingId === bookingId);

  if (!target) {
    return {
      status: "REFUND_FAILED_NOT_FOUND",
      nextAction: "SHOW_ERROR",
      data: { bookingId: bookingId },
      actionRequired: true,
    };
  }

  return {
    status: "REFUND_STATUS",
    nextAction: "SHOW_REFUND_INFO",
    data: {
      bookingId: bookingId,
      bookingStatus: target.bookingStatus,
      paymentStatus: target.paymentStatus,
      refundAmount: target.refundAmount || target.totalAmount,
      refundId: target.refundId,
    },
    actionRequired: true,
  };
};

// Reschedule Node
const rescheduleNode = async (state) => {
  const { bookingId, showTime, showDate, userId } = state;

  if (!bookingId) {
    return {
      status: "RESCHEDULE_BOOKING_ID_REQUIRED",
      nextAction: "ASK_BOOKING_ID",
      data: {},
      actionRequired: true,
    };
  }

  const bookings = await getBookingHistoryTool(userId);
  const target = bookings.find((b) => b.bookingId === bookingId);
  if (!target) {
    return {
      status: "RESCHEDULE_FAILED_NOT_FOUND",
      nextAction: "SHOW_ERROR",
      data: { bookingId: bookingId },
      actionRequired: true,
    };
  }

  if (!showTime && !showDate) {
    return {
      status: "RESCHEDULE_DATETIME_REQUIRED",
      nextAction: "ASK_DATETIME",
      data: { bookingId: bookingId },
      actionRequired: true,
    };
  }

  const dateStr = showDate || new Date().toISOString().split("T")[0];
  const candidateShows = await findShowsTool(target.show.movie._id, dateStr);
  const matchingShow = candidateShows.find(
    (s) => s.startTime.includes(showTime) || showTime?.includes(s.startTime),
  );

  if (!matchingShow) {
    return {
      status: "RESCHEDULE_SHOWTIME_NOT_FOUND",
      nextAction: "SHOW_ERROR",
      data: { bookingId: bookingId, searchedTime: showTime, date: dateStr },
      actionRequired: true,
    };
  }

  const result = await rescheduleBookingTool(
    userId,
    bookingId,
    matchingShow._id,
  );
  if (result.success) {
    return {
      status: "RESCHEDULE_SUCCESS",
      nextAction: "COMPLETE_RESCHEDULE",
      data: {
        bookingId: bookingId,
        newTheatre: matchingShow.screen?.theatre?.name,
        startTime: matchingShow.startTime,
      },
      actionRequired: true,
    };
  } else {
    return {
      status: "RESCHEDULE_FAILED",
      nextAction: "SHOW_ERROR",
      data: { bookingId: bookingId, errorMessage: result.message },
      actionRequired: true,
    };
  }
};

const recommendationNode = async (state) => {
  const { genre, language, audience, mood, similarMovie, userId } = state;
  const prefs = await retrievePreferences(userId);
  const lastMsg = state.messages[state.messages.length - 1]?.content || "";

  let matchedMovie = null;
  if (similarMovie) {
    matchedMovie = await Movie.findOne({
      title: { $regex: new RegExp(similarMovie, "i") },
    });
  }

  let maxRuntime = null;
  let minRuntime = null;

  const underHoursMatch = lastMsg.match(
    /(?:under|less\s+than)\s+(\d+)\s*hours?/i,
  );
  if (underHoursMatch) {
    maxRuntime = parseInt(underHoursMatch[1]) * 60;
  }

  const overHoursMatch = lastMsg.match(/(?:above|over)\s+(\d+)\s*hours?/i);
  if (overHoursMatch) {
    minRuntime = parseInt(overHoursMatch[1]) * 60;
  }

  const underMinsMatch = lastMsg.match(
    /(?:under|less\s+than)\s+(\d+)\s*(?:minutes|mins?)/i,
  );
  if (underMinsMatch) {
    maxRuntime = parseInt(underMinsMatch[1]);
  }

  const overMinsMatch = lastMsg.match(
    /(?:above|over)\s+(\d+)\s*(?:minutes|mins?)/i,
  );
  if (overMinsMatch) {
    minRuntime = parseInt(overMinsMatch[1]);
  }

  const hourMovieMatch = lastMsg.match(/(\d+)\s*hour\s+movie/i);
  if (hourMovieMatch) {
    const hrs = parseInt(hourMovieMatch[1]);
    minRuntime = (hrs - 0.5) * 60;
    maxRuntime = (hrs + 0.5) * 60;
  }

  const filter = { isActive: true };
  if (matchedMovie) {
    filter._id = { $ne: matchedMovie._id };
    filter.$or = [
      { genres: { $in: matchedMovie.genres } },
      { language: matchedMovie.language },
    ];
  } else {
    const genresToFilter = [];
    if (genre) {
      genresToFilter.push(genre);
    }
    if (
      audience &&
      (audience.toLowerCase() === "family" || audience.toLowerCase() === "kids")
    ) {
      genresToFilter.push("family", "animation", "adventure");
    }
    if (genresToFilter.length > 0) {
      filter.genres = { $in: genresToFilter.map((g) => new RegExp(g, "i")) };
    }
    if (language) {
      filter.language = new RegExp(language, "i");
    }
  }

  if (maxRuntime) {
    filter.runtime = { $lte: maxRuntime };
  }
  if (minRuntime) {
    filter.runtime = { ...filter.runtime, $gte: minRuntime };
  }

  let candidateMovies = await Movie.find(filter)
    .sort({ popularity: -1 })
    .limit(20);
  if (candidateMovies.length === 0) {
    candidateMovies = await Movie.find({ isActive: true })
      .sort({ popularity: -1 })
      .limit(20);
  }

  return {
    status: "RECOMMENDATIONS_FOUND",
    nextAction: "SHOW_RECOMMENDATIONS",
    data: {
      candidates: candidateMovies.slice(0, 5).map((m) => ({
        title: m.title,
        genres: m.genres,
        language: m.language,
        runtime: m.runtime,
        rating: m.rating,
        overview: m.overview,
      })),
      prefs,
    },
    actionRequired: true,
  };
};

//  Booking History Node
const historyNode = async (state) => {
  const { userId } = state;
  const bookings = await getBookingHistoryTool(userId);

  if (bookings.length === 0) {
    return {
      status: "HISTORY_EMPTY",
      nextAction: "SHOW_ERROR",
      data: {},
      actionRequired: true,
    };
  }

  return {
    status: "HISTORY_LIST",
    nextAction: "SHOW_HISTORY",
    data: {
      bookings: bookings.slice(0, 5).map((b) => ({
        movie: b.show?.movie?.title,
        theatre: b.show?.screen?.theatre?.name,
        seats: b.seats,
        status: b.bookingStatus,
        date: new Date(b.createdAt).toLocaleDateString(),
      })),
    },
    actionRequired: true,
  };
};

//  General Chat Node
const generalChatNode = async (state) => {
  if (state.status === "PENDING_WORKFLOW_PAUSED") {
    return {
      status: "PENDING_WORKFLOW_PAUSED",
      nextAction: "ASK_RESUME",
      data: {
        message:
          "Welcome back! You have an unfinished booking.\nWould you like to continue it or start something new?",
      },
      actionRequired: false,
    };
  } else if (state.status === "GREETING") {
    return {
      status: "GREETING",
      nextAction: "RESPOND_GREETING",
      data: {
        message: "Hello! 👋 Welcome to CineVerse.\nHow can I help you today?",
      },
      actionRequired: false,
    };
  }

  return {
    status: "GENERAL_CHAT_REPLY",
    nextAction: "RESPOND_GENERAL",
    data: {},
    actionRequired: true,
  };
};

const responseFormatterNode = async (state) => {
  const { data, actionRequired } = state;
  let sanitizedData = null;

  if (data) {
    sanitizedData = JSON.parse(JSON.stringify(data));
    const sanitize = (obj) => {
      if (Array.isArray(obj)) {
        obj.forEach(sanitize);
      } else if (obj !== null && typeof obj === "object") {
        delete obj._id;
        delete obj.__v;
        delete obj.createdAt;
        delete obj.updatedAt;
        for (const key in obj) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(sanitizedData);
  }

  return { sanitizedData };
};

const responderNode = async (state) => {
  const {
    intent,
    status,
    nextAction,
    sanitizedData,
    pendingAction,
    pendingOptions,
    actionRequired,
  } = state;

  console.log("--- RESPONDER NODE INPUT ---");
  console.log({
    node: "responderNode",
    status,
    nextAction,
    pendingAction,
    pendingOptions,
    data: state.data,
    sanitizedData,
    actionRequired,
  });
  console.log("----------------------------");

  if (actionRequired === false) {
    let bypassMessage = sanitizedData?.message || "Your action is complete.";
    if (status === "BOOKING_SUCCESS") {
      bypassMessage =
        "Your booking was successful! Redirecting you to checkout...";
    }
    return {
      messages: [{ role: "assistant", content: bypassMessage }],
    };
  }

  // Sanity check invalid states
  if (!status || !nextAction || typeof actionRequired === "undefined") {
    console.error("INVALID STATE RECEIVED IN RESPONDER:", {
      status,
      nextAction,
      actionRequired,
      intent,
    });
  }

  const systemPrompt = `
You are CineVerse AI Buddy, a warm, premium, helpful, and professional cinema assistant.

CRITICAL INSTRUCTIONS:
- You are NOT allowed to change any factual information.
- You are ONLY allowed to rewrite the supplied structured data naturally.
- Never invent information.
- Never search.
- Never infer.
- Never modify.
- Never replace movie names.
- Never replace theatre names.
- Never replace dates.
- Never replace times.
- If structured data exists, ignore previous conversation facts.
- Do not repeat the previous assistant message. Keep the dialogue moving forward.

Structured State Context:
- Active Intent: ${intent || "None"}
- Status: ${status || "None"}
- Next Action: ${nextAction || "None"}
- Pending Action: ${pendingAction || "None"}
- Pending Options: ${JSON.stringify(pendingOptions, null, 2)}
- Data: ${JSON.stringify(sanitizedData, null, 2)}

Convert this context into a natural conversational response matching the guidelines above.
`;

  try {
    const lastUserMessage = state.messages
      .filter((m) => m.role === "user")
      .pop() || { role: "user", content: "" };
    const reply = await callLLM(systemPrompt, [lastUserMessage]);
    return {
      messages: [{ role: "assistant", content: reply }],
    };
  } catch (err) {
    console.error("Responder node LLM execution error:", err);
    console.error(err.stack);
    return {
      messages: [
        {
          role: "assistant",
          content:
            "I'm having trouble phrasing my response right now, but I can help you with your booking. What would you like to check next?",
        },
      ],
    };
  }
};

// Router edge function
const routerEdge = (state) => {
  return state.intent || "general_chat";
};

const workflow = new StateGraph(AgentState)
  .addNode("intentDetect", intentDetectNode)
  .addNode("booking", bookingNode)
  .addNode("cancellation", cancellationNode)
  .addNode("refund", refundNode)
  .addNode("reschedule", rescheduleNode)
  .addNode("recommendation", recommendationNode)
  .addNode("booking_history", historyNode)
  .addNode("general_chat", generalChatNode)
  .addNode("formatter", responseFormatterNode)
  .addNode("responder", responderNode);

workflow.addEdge("__start__", "intentDetect");

workflow.addConditionalEdges("intentDetect", routerEdge, {
  booking: "booking",
  cancellation: "cancellation",
  refund: "refund",
  reschedule: "reschedule",
  recommendation: "recommendation",
  booking_history: "booking_history",
  general_chat: "general_chat",
});

workflow.addEdge("booking", "formatter");
workflow.addEdge("cancellation", "formatter");
workflow.addEdge("refund", "formatter");
workflow.addEdge("reschedule", "formatter");
workflow.addEdge("recommendation", "formatter");
workflow.addEdge("booking_history", "formatter");
workflow.addEdge("general_chat", "formatter");
workflow.addEdge("formatter", "responder");
workflow.addEdge("responder", END);

const graph = workflow.compile();

module.exports = graph;
