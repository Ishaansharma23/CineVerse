const { StateGraph, END } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const AgentState = require("./state");
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

// Initialize LLM safely
let model = null;
const initModel = () => {
  if (process.env.GEMINI_API_KEY) {
    model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "gemini-1.5-flash",
      temperature: 0.1,
    });
  }
};
initModel();

// Helper to call LLM safely
const callLLM = async (systemPrompt, messages) => {
  if (!model) {
    return "Gemini API key is missing. Please define GEMINI_API_KEY in your backend .env file to enable the AI Buddy.";
  }
  try {
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        content: m.content,
      })),
    ];
    const response = await model.invoke(formattedMessages);
    return response.content;
  } catch (err) {
    console.error("LLM invoke error:", err);
    return `Error: ${err.message}`;
  }
};

// Intent Detection Node
const intentDetectNode = async (state) => {
  const { messages } = state;
  if (!model) {
    return {
      intent: "general_chat",
      messages: [{ role: "assistant", content: "AI Buddy needs GEMINI_API_KEY set in .env." }],
    };
  }

  try {
    const routerResponseText = await callLLM(ROUTER_SYSTEM_PROMPT, messages);
    // Sanitize markdown wraps if LLM returns backticks
    const cleanedJson = routerResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const routerData = JSON.parse(cleanedJson);

    // Save preference to RAG if movie selection or genre is mentioned
    if (state.userId && routerData.entities?.movie) {
      await storePreference(state.userId, `Prefers movie: ${routerData.entities.movie}`);
    }
    if (state.userId && routerData.entities?.theatre) {
      await storePreference(state.userId, `Prefers cinema: ${routerData.entities.theatre}`);
    }

    return {
      intent: routerData.intent || "general_chat",
      movie: routerData.entities?.movie || state.movie,
      theatre: routerData.entities?.theatre || state.theatre,
      showDate: routerData.entities?.date || state.showDate,
      showTime: routerData.entities?.showTime || state.showTime,
      seatCount: routerData.entities?.seatCount || state.seatCount,
      bookingId: routerData.entities?.bookingId || state.bookingId,
      genre: routerData.entities?.genre || state.genre,
      language: routerData.entities?.language || state.language,
      audience: routerData.entities?.audience || state.audience,
      mood: routerData.entities?.mood || state.mood,
      similarMovie: routerData.entities?.similarMovie || state.similarMovie,
    };
  } catch (err) {
    console.error("Intent parsing error:", err);
    return { intent: "general_chat" };
  }
};

// Booking Node
const bookingNode = async (state) => {
  const { movie, theatre, showDate, showTime, seatCount, userId } = state;

  if (!movie) {
    return {
      messages: [{ role: "assistant", content: "Which movie would you like to watch?" }],
    };
  }

  // Search matching movies
  const movies = await searchMovieTool(movie);
  if (movies.length === 0) {
    return {
      messages: [{ role: "assistant", content: `I couldn't find "${movie}" in our listing catalog. Let me check recommendations or choose another title.` }],
    };
  }

  const selectedMovie = movies[0];

  // Search theatres
  if (!theatre) {
    return {
      messages: [{ role: "assistant", content: `I found "${selectedMovie.title}". Which theatre/city would you like to view shows in?` }],
    };
  }

  const theatres = await searchNearbyTheatresTool(theatre);
  if (theatres.length === 0) {
    return {
      messages: [{ role: "assistant", content: `No theatres found in "${theatre}" displaying shows.` }],
    };
  }

  const selectedTheatre = theatres[0];

  // Verify date or assign default today
  const targetDate = showDate ? new Date(showDate) : new Date();
  const dateStr = targetDate.toISOString().split("T")[0];

  // Find matching shows
  const shows = await findShowsTool(selectedMovie._id, dateStr);
  const matchingShows = shows.filter(s => s.theatre._id.toString() === selectedTheatre._id.toString());

  if (matchingShows.length === 0) {
    return {
      messages: [{ role: "assistant", content: `I searched for shows of ${selectedMovie.title} at ${selectedTheatre.name} for ${dateStr}, but couldn't find active listings. Suggesting you verify slot timings.` }],
    };
  }

  // Filter by time if user provided
  let targetShow = matchingShows[0];
  if (showTime) {
    const matchedTime = matchingShows.find(s => s.startTime.includes(showTime) || showTime.includes(s.startTime));
    if (matchedTime) targetShow = matchedTime;
  }

  // If we have verified show slot, attempt reservation confirmation
  const lastMessage = state.messages[state.messages.length - 1]?.content.toLowerCase();
  const confirmationWords = ["yes", "confirm", "reserve", "book", "sure", "ha"];
  const isConfirmed = confirmationWords.some(w => lastMessage.includes(w));

  if (!isConfirmed) {
    const layout = await getSeatLayoutTool(targetShow._id);
    const available = layout.filter(s => s.available);
    const seatsToSuggest = available.slice(0, seatCount).map(s => s.name).join(", ");

    return {
      showId: targetShow._id,
      messages: [{
        role: "assistant",
        content: `I found ${selectedMovie.title} at ${selectedTheatre.name} (${targetShow.startTime}). Available adjacent seats: ${seatsToSuggest || "None"}. Shall I go ahead and reserve these tickets?`
      }],
    };
  }

  // Create real booking reservation
  const result = await reserveSeatsTool(userId, state.showId || targetShow._id, seatCount);
  if (result.success) {
    return {
      bookingId: result.booking.bookingId,
      actionRequired: { type: "navigate", payload: "/checkout" },
      messages: [{
        role: "assistant",
        content: `Reserved seats ${result.booking.seats.join(", ")} successfully! Directing you to checkout to complete payment...`
      }],
    };
  } else {
    return {
      messages: [{ role: "assistant", content: `Booking reservation failed: ${result.message}` }],
    };
  }
};

//  Cancellation Node
const cancellationNode = async (state) => {
  const { bookingId, userId } = state;

  if (!bookingId) {
    return {
      messages: [{ role: "assistant", content: "Please provide the booking ID of the ticket you want to cancel (e.g. CV-178...)." }],
    };
  }

  const result = await cancelBookingTool(userId, bookingId);
  return {
    messages: [{ role: "assistant", content: result.message }],
  };
};

// Refund Node
const refundNode = async (state) => {
  const { bookingId, userId } = state;

  if (!bookingId) {
    return {
      messages: [{ role: "assistant", content: "To check your refund eligibility, please specify the booking ID." }],
    };
  }

  // Find details
  const bookings = await getBookingHistoryTool(userId);
  const target = bookings.find(b => b.bookingId === bookingId);

  if (!target) {
    return {
      messages: [{ role: "assistant", content: `I couldn't locate booking reference ${bookingId} under your account.` }],
    };
  }

  let text = `Booking Reference ${bookingId} is currently status: **${target.bookingStatus.toUpperCase()}**.\n`;
  if (target.paymentStatus === "refunded") {
    text += `Your refund of ₹${target.refundAmount || target.totalAmount} has been processed via Razorpay (Reference: ${target.refundId || "N/A"}).`;
  } else if (target.bookingStatus === "cancelled") {
    text += `The ticket has been cancelled. If refund is pending, it usually updates within 5-7 business days.`;
  } else {
    text += `This booking is active. Cancellation is allowed up to 2 hours before showtime.`;
  }

  return {
    messages: [{ role: "assistant", content: text }],
  };
};

// Reschedule Node
const rescheduleNode = async (state) => {
  const { bookingId, showTime, showDate, userId } = state;

  if (!bookingId) {
    return {
      messages: [{ role: "assistant", content: "Please specify the booking ID you wish to reschedule." }],
    };
  }

  // Lookup the original booking
  const bookings = await getBookingHistoryTool(userId);
  const target = bookings.find(b => b.bookingId === bookingId);
  if (!target) {
    return { messages: [{ role: "assistant", content: `I couldn't find booking ID ${bookingId}.` }] };
  }

  if (!showTime && !showDate) {
    return {
      messages: [{ role: "assistant", content: "What new date or timing would you prefer for rescheduling?" }],
    };
  }

  // Find candidate shows of the same movie
  const dateStr = showDate || new Date().toISOString().split("T")[0];
  const candidateShows = await findShowsTool(target.show.movie._id, dateStr);
  const matchingShow = candidateShows.find(s => s.startTime.includes(showTime) || showTime?.includes(s.startTime));

  if (!matchingShow) {
    return {
      messages: [{ role: "assistant", content: `I couldn't find any alternative showtime matching ${showTime || ""} on ${dateStr}.` }],
    };
  }

  // Execute reschedule tool
  const result = await rescheduleBookingTool(userId, bookingId, matchingShow._id);
  return {
    messages: [{ role: "assistant", content: result.message || `Rescheduled successfully to ${matchingShow.theatre.name} at ${matchingShow.startTime}!` }],
  };
};

const recommendationNode = async (state) => {
  const { genre, language, audience, mood, similarMovie, userId } = state;
  const prefs = await retrievePreferences(userId);
  const lastMsg = state.messages[state.messages.length - 1]?.content || "";

  let matchedMovie = null;
  if (similarMovie) {
    matchedMovie = await Movie.findOne({ title: { $regex: new RegExp(similarMovie, "i") } });
  }

  let maxRuntime = null;
  let minRuntime = null;

  const underHoursMatch = lastMsg.match(/(?:under|less\s+than)\s+(\d+)\s*hours?/i);
  if (underHoursMatch) {
    maxRuntime = parseInt(underHoursMatch[1]) * 60;
  }

  const overHoursMatch = lastMsg.match(/(?:above|over)\s+(\d+)\s*hours?/i);
  if (overHoursMatch) {
    minRuntime = parseInt(overHoursMatch[1]) * 60;
  }

  const underMinsMatch = lastMsg.match(/(?:under|less\s+than)\s+(\d+)\s*(?:minutes|mins?)/i);
  if (underMinsMatch) {
    maxRuntime = parseInt(underMinsMatch[1]);
  }

  const overMinsMatch = lastMsg.match(/(?:above|over)\s+(\d+)\s*(?:minutes|mins?)/i);
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
      { language: matchedMovie.language }
    ];
  } else {
    const genresToFilter = [];
    if (genre) {
      genresToFilter.push(genre);
    }
    if (audience && (audience.toLowerCase() === "family" || audience.toLowerCase() === "kids")) {
      genresToFilter.push("family", "animation", "adventure");
    }
    if (genresToFilter.length > 0) {
      filter.genres = { $in: genresToFilter.map(g => new RegExp(g, "i")) };
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

  let candidateMovies = await Movie.find(filter).sort({ popularity: -1 }).limit(20);
  if (candidateMovies.length === 0) {
    candidateMovies = await Movie.find({ isActive: true }).sort({ popularity: -1 }).limit(20);
  }

  const movieData = candidateMovies.map(m => ({
    title: m.title,
    genres: m.genres,
    language: m.language,
    runtime: m.runtime,
    rating: m.rating,
    releaseYear: m.releaseDate ? new Date(m.releaseDate).getFullYear() : null,
    overview: m.overview
  }));

  const prompt = `
  You are CineVerse AI Buddy, recommending movies to our user.
  User long-term preferences: ${prefs.join(", ") || "None"}
  Current user request: "${lastMsg}"
  Detected request parameters: genre=${genre || ""}, language=${language || ""}, audience=${audience || ""}, mood=${mood || ""}, similarMovie=${similarMovie || ""}
  
  Candidate movies list:
  ${JSON.stringify(movieData, null, 2)}
  
  Instructions:
  - Suggest only from the provided Candidate movies list.
  - Never invent or hallucinate movies that are not on the candidate list.
  - If no movies from the list match the request closely, clearly state that no matching movies are currently available, and suggest the next closest alternatives from the candidate list instead.
  - Recommend a maximum of 5 movies.
  - Rank the recommendations from best to worst.
  - Provide a natural, friendly, conversational response. Explain in 1-2 sentences why each recommended movie matches the request and preferences. Do not use generic robotic lists.
  `;

  const recommendationReply = await callLLM(prompt, state.messages);
  return {
    messages: [{ role: "assistant", content: recommendationReply }],
  };
};

//  Booking History Node
const historyNode = async (state) => {
  const { userId } = state;
  const bookings = await getBookingHistoryTool(userId);

  if (bookings.length === 0) {
    return {
      messages: [{ role: "assistant", content: "You have no transaction bookings on CineVerse yet!" }],
    };
  }

  let text = "### Your Booking History:\n\n";
  bookings.slice(0, 5).forEach((b) => {
    const date = new Date(b.createdAt).toLocaleDateString();
    text += `- **${b.show?.movie?.title || "Cinema"}** (${b.show?.theatre?.name || "Theatre"})\n  Date: ${date} | Seats: ${b.seats.join(", ")} | Status: *${b.bookingStatus}*\n`;
  });

  return {
    messages: [{ role: "assistant", content: text }],
  };
};

//  General Chat Node
const generalChatNode = async (state) => {
  const reply = await callLLM(ASSISTANT_SYSTEM_PROMPT, state.messages);
  return {
    messages: [{ role: "assistant", content: reply }],
  };
};

// Router edge function
const routerEdge = (state) => {
  return state.intent || "general_chat";
};

// Compile LangGraph workflow
const workflow = new StateGraph(AgentState)
  .addNode("intentDetect", intentDetectNode)
  .addNode("booking", bookingNode)
  .addNode("cancellation", cancellationNode)
  .addNode("refund", refundNode)
  .addNode("reschedule", rescheduleNode)
  .addNode("recommendation", recommendationNode)
  .addNode("booking_history", historyNode)
  .addNode("general_chat", generalChatNode);

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

workflow.addEdge("booking", END);
workflow.addEdge("cancellation", END);
workflow.addEdge("refund", END);
workflow.addEdge("reschedule", END);
workflow.addEdge("recommendation", END);
workflow.addEdge("booking_history", END);
workflow.addEdge("general_chat", END);

const graph = workflow.compile();

module.exports = graph;
