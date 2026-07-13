const crypto = require("crypto");
const graph = require("../agent/graph");
const { redisClient } = require("../config/redis");

const handleChatSession = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Please provide message parameter.",
      });
    }

    let sessionId = req.cookies.ai_session;
    let session = null;

    if (sessionId) {
      const data = await redisClient.get(`ai_session:${sessionId}`);
      if (data) {
        session = JSON.parse(data);
        if (session.userId !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Unauthorized session access.",
          });
        }
      }
    }

    if (!session) {
      sessionId = crypto.randomUUID();
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
      };

      res.cookie("ai_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/ai",
        maxAge: 30 * 60 * 1000,
      });
    }

    session.messages.push({ role: "user", content: message });
    session.lastUpdated = Date.now();

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

    session.movie = result.movie;
    session.theatre = result.theatre;
    session.showDate = result.showDate;
    session.showTime = result.showTime;
    session.showId = result.showId;
    session.bookingId = result.bookingId;
    session.selectedSeats = result.selectedSeats;
    session.seatCount = result.seatCount;

    const finalMsg = result.messages[result.messages.length - 1];
    if (finalMsg) {
      session.messages.push(finalMsg);
    }

    await redisClient.set(
      `ai_session:${sessionId}`,
      JSON.stringify(session),
      { EX: 1800 }
    );

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
