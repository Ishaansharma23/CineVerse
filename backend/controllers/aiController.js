const graph = require("../agent/graph");

const sessionStore = new Map();

// Session expiry manager to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionStore.entries()) {
    if (now - value.lastUpdated > 30 * 60 * 1000) { // 30 Minutes TTL
      sessionStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

const handleChatSession = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Please provide message and sessionId parameters.",
      });
    }

    // Retrieve or initialize state context
    let session = sessionStore.get(sessionId);
    if (!session) {
      session = {
        userId: req.user._id.toString(),
        sessionId: sessionId,
        messages: [],
        movie: null,
        theatre: null,
        showDate: null,
        showTime: null,
        showId: null,
        bookingId: null,
        selectedSeats: [],
        seatCount: 1,
        lastUpdated: Date.now(),
      };
    }

    // Update with user query input
    session.messages.push({ role: "user", content: message });
    session.lastUpdated = Date.now();

    // Invoke LangGraph compiler workflow
    const result = await graph.invoke({
      userId: req.user._id,
      sessionId: sessionId,
      messages: session.messages,
      movie: session.movie,
      theatre: session.theatre,
      showDate: session.showDate,
      showTime: session.showTime,
      showId: session.showId,
      bookingId: session.bookingId,
      selectedSeats: session.selectedSeats,
      seatCount: session.seatCount,
    });

    // Update stored state from output nodes
    session.movie = result.movie;
    session.theatre = result.theatre;
    session.showDate = result.showDate;
    session.showTime = result.showTime;
    session.showId = result.showId;
    session.bookingId = result.bookingId;
    session.selectedSeats = result.selectedSeats;
    session.seatCount = result.seatCount;

    // Append LLM response to message list
    const finalMsg = result.messages[result.messages.length - 1];
    if (finalMsg) {
      session.messages.push(finalMsg);
    }

    sessionStore.set(sessionId, session);

    res.status(200).json({
      success: true,
      message: finalMsg ? finalMsg.content : "No response.",
      action: result.actionRequired ? result.actionRequired.type : null,
      payload: result.actionRequired ? result.actionRequired.payload : null,
    });
  } catch (error) {
    console.error("AI Controller error:", error);
    res.status(500).json({
      success: false,
      message: "AI Buddy encountered an error processing your query.",
      error: error.message,
    });
  }
};

module.exports = {
  handleChatSession,
};
