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
      try {
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
      } catch (err) {
        console.error("Redis retrieval failure:", err);
      }
    }

    if (!session) {
      try {
        const oldSessionId = await redisClient.get(`user_ai_session:${req.user._id}`);
        if (oldSessionId) {
          await redisClient.del(`ai_session:${oldSessionId}`);
        }
      } catch (err) {
        console.error("Redis lookup of old session failed:", err);
      }

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
        intent: "general_chat",
        pendingAction: null,
        pendingOptions: null,
        outcomeStatus: null,
        outcomeData: null,
      };

      res.cookie("ai_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/ai",
        maxAge: 30 * 60 * 1000,
      });

      try {
        await redisClient.set(`user_ai_session:${req.user._id}`, sessionId, { EX: 1800 });
      } catch (err) {
        console.error("Redis saving user-to-session mapping failed:", err);
      }
    }

    session.messages.push({ role: "user", content: message });
    session.lastUpdated = Date.now();

    const result = await graph.invoke({
      userId: req.user._id,
      sessionId: sessionId,
      messages: session.messages || [],
      movie: session.movie || null,
      theatre: session.theatre || null,
      showDate: session.showDate || null,
      showTime: session.showTime || null,
      showId: session.showId || null,
      bookingId: session.bookingId || null,
      selectedSeats: session.selectedSeats || [],
      seatCount: session.seatCount || 1,
      intent: session.intent || "general_chat",
      pendingAction: session.pendingAction || null,
      pendingOptions: session.pendingOptions || null,
      status: session.status || null,
      nextAction: session.nextAction || null,
      data: session.data || null,
      actionRequired: session.actionRequired ?? true,
      sanitizedData: session.sanitizedData || null,
    });

    session.movie = result.movie || null;
    session.theatre = result.theatre || null;
    session.showDate = result.showDate || null;
    session.showTime = result.showTime || null;
    session.showId = result.showId || null;
    session.bookingId = result.bookingId || null;
    session.selectedSeats = result.selectedSeats || [];
    session.seatCount = result.seatCount || 1;
    session.intent = result.intent || "general_chat";
    session.pendingAction = result.pendingAction || null;
    session.pendingOptions = result.pendingOptions || null;
    session.status = result.status || null;
    session.nextAction = result.nextAction || null;
    session.data = result.data || null;
    session.actionRequired = result.actionRequired ?? true;
    session.sanitizedData = result.sanitizedData || null;

    const finalMsg = result.messages[result.messages.length - 1];
    if (finalMsg) {
      session.messages.push(finalMsg);
    }

    try {
      await redisClient.set(
        `ai_session:${sessionId}`,
        JSON.stringify(session),
        { EX: 1800 }
      );
      await redisClient.expire(`user_ai_session:${req.user._id}`, 1800);
    } catch (err) {
      console.error("Redis save session failure:", err);
    }

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
