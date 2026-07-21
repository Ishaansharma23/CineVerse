import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  MessageSquare, X, Send, Sparkles, User, Bot, Minus, RefreshCw, 
  Film, Ticket, CreditCard, Star, ArrowRight, Brain, MapPin, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import request from "../../services/api";
import toast from "react-hot-toast";

const AIBuddy = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("Thinking...");

  const chatEndRef = useRef(null);

  useEffect(() => {
    const greetingName = isAuthenticated && user ? user.name : "Guest";
    const greetingText = isAuthenticated 
      ? `Hi ${greetingName}! 👋 I'm your CineVerse AI Buddy. You can chat with me naturally to book showtimes, recommend movies, reschedule tickets, or check refund status.`
      : `Hi Guest! 👋 I'm your CineVerse AI Buddy. Please Sign In using the button at the top right to book shows, check history, or reschedule tickets!`;

    const storedData = localStorage.getItem("cv_ai_chat");
    if (storedData) {
      try {
        const { messages: storedMessages, lastActive, storedUser } = JSON.parse(storedData);
        const age = Date.now() - lastActive;
        const userMatches = storedUser === (isAuthenticated && user ? user.email : "Guest");
        if (age < 15 * 60 * 1000 && userMatches && storedMessages && storedMessages.length > 0) {
          setMessages(storedMessages);
          return;
        }
      } catch (e) {
        console.error("Failed to parse stored chat:", e);
      }
    }

    setMessages([
      {
        role: "assistant",
        content: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ]);
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (messages.length > 0) {
      const data = {
        messages,
        lastActive: Date.now(),
        storedUser: isAuthenticated && user ? user.email : "Guest"
      };
      localStorage.setItem("cv_ai_chat", JSON.stringify(data));
    }
  }, [messages, isAuthenticated, user]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen, isMinimized]);

  useEffect(() => {
    if (!loading) {
      setStatusText("Thinking...");
      return;
    }

    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let statusCycle = ["Thinking...", "Searching shows...", "Checking seats...", "Processing request..."];

    if (lastUserMessage.includes("reschedule") || lastUserMessage.includes("cancel") || lastUserMessage.includes("change")) {
      statusCycle = ["Retrieving booking...", "Verifying ticket details...", "Checking seat inventory...", "Updating reservation..."];
    } else if (lastUserMessage.includes("recommend") || lastUserMessage.includes("suggest") || lastUserMessage.includes("trending")) {
      statusCycle = ["Searching movie catalog...", "Analyzing watch patterns...", "Curating matches...", "Finalizing suggestions..."];
    } else if (lastUserMessage.includes("seat") || lastUserMessage.includes("book") || lastUserMessage.includes("show")) {
      statusCycle = ["Retrieving showtimes...", "Checking seat layout...", "Calculating fees...", "Preparing reservation..."];
    } else if (lastUserMessage.includes("history") || lastUserMessage.includes("refund")) {
      statusCycle = ["Accessing purchase log...", "Verifying status...", "Connecting to processor...", "Retrieving records..."];
    }

    setStatusText(statusCycle[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % statusCycle.length;
      setStatusText(statusCycle[index]);
    }, 1400);

    return () => clearInterval(interval);
  }, [loading, messages]);

  const handleSend = async (text) => {
    const query = text || inputVal;
    if (!query.trim()) return;

    setInputVal("");

    const storedData = localStorage.getItem("cv_ai_chat");
    let isExpired = false;
    if (storedData) {
      try {
        const { lastActive } = JSON.parse(storedData);
        if (Date.now() - lastActive >= 15 * 60 * 1000) {
          isExpired = true;
        }
      } catch (e) {}
    }

    const currentTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isExpired) {
      const greetingName = isAuthenticated && user ? user.name : "Guest";
      const greetingText = isAuthenticated 
        ? `Hi ${greetingName}! 👋 I'm your CineVerse AI Buddy. You can chat with me naturally to book showtimes, recommend movies, reschedule tickets, or check refund status.`
        : `Hi Guest! 👋 I'm your CineVerse AI Buddy. Please Sign In using the button at the top right to book shows, check history, or reschedule tickets!`;
      setMessages([
        { role: "assistant", content: greetingText, timestamp: currentTimestamp },
        { role: "user", content: query, timestamp: currentTimestamp }
      ]);
    } else {
      setMessages((prev) => [...prev, { role: "user", content: query, timestamp: currentTimestamp }]);
    }

    if (!isAuthenticated) {
      setLoading(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "To chat and reserve tickets with the AI Booking Buddy, please Sign In using the button at the top right of the page!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    setLoading(true);

    try {
      const response = await request("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: query }),
      });

      if (response.success) {
        const botMsg = {
          role: "assistant",
          content: response.message,
          action: response.action,
          payload: response.payload,
          bookingId: response.bookingId,
          cards: response.cards || [],
          reasoning: response.reasoning || null,
          chips: response.chips || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, botMsg]);

        if (response.action === "navigate" && response.payload) {
          if (response.bookingId) {
            localStorage.setItem('cv_active_booking_id', response.bookingId);
          }
          toast.success("AI Buddy: Booking reserved! Redirecting...");
          setTimeout(() => {
            setIsOpen(false);
            navigate(response.payload);
          }, 1500);
        }
      } else {
        toast.error("AI Buddy: Unexpected response from assistant.");
      }
    } catch (err) {
      console.error("AI Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble processing that query right now. Please try again in a moment or select a suggested option.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    localStorage.removeItem("cv_ai_chat");
    const greetingName = isAuthenticated && user ? user.name : "Guest";
    const greetingText = isAuthenticated 
      ? `Session refreshed! Hi ${greetingName}! 👋 How can I help you with your movie bookings today?`
      : `Session refreshed! Hi Guest! 👋 Please Sign In to start booking showtimes.`;
    setMessages([{ role: "assistant", content: greetingText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    toast.success("AI Buddy session reset.");
  };

  const suggestedActions = [
    { label: "Book Movie", icon: Film, query: "Book a movie showtime for today" },
    { label: "Recommended", icon: Sparkles, query: "What movies do you recommend?" },
    { label: "My Bookings", icon: Ticket, query: "Show my booking history" },
    { label: "Cancel Ticket", icon: X, query: "I want to cancel a ticket" },
    { label: "Refund Status", icon: CreditCard, query: "Check my refund status" },
    { label: "Trending", icon: Star, query: "Show top trending movies" },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none font-sans antialiased text-white">
      {/* 1. FLOATING AI LAUNCHER BUTTON */}
      <AnimatePresence>
        {(!isOpen || isMinimized) && (
          <motion.button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-[50px] h-[50px] bg-neutral-900 border border-neutral-750 hover:border-rose-500/50 rounded-full flex items-center justify-center shadow-xl shadow-black/60 cursor-pointer group relative overflow-hidden active:scale-95 transition-all"
            aria-label="Open AI Assistant"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-600/20 to-purple-600/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-rose-400 group-hover:text-rose-300 transition-colors" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. CHAT WINDOW CONTAINER */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[calc(100vw-32px)] sm:w-[460px] h-[680px] max-h-[85vh] bg-[#0E0E0E] border border-neutral-800 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden backdrop-blur-xl relative"
          >
            {/* HEADER */}
            <div className="flex-shrink-0 z-20 px-4 py-3.5 border-b border-neutral-800/80 bg-[#121212] flex justify-between items-center relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center border border-white/10 shadow-inner flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-tight text-neutral-100 flex items-center gap-2">
                    CineVerse AI Buddy
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Online • AI Booking Assistant
                  </p>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetSession}
                  title="Reset Conversation"
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  title="Minimize Window"
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Window"
                  className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MESSAGES SCROLL AREA */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent z-10">
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {/* User / Bot Avatar */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] border mt-0.5 ${
                        m.role === "user"
                          ? "bg-purple-950/40 border-purple-800/40 text-purple-300"
                          : "bg-neutral-850 border-neutral-750 text-rose-400"
                      }`}
                    >
                      {m.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>

                    {/* Message Content & Bubble */}
                    <div className="space-y-1.5 max-w-[85%]">
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs font-normal leading-relaxed border select-text ${
                          m.role === "user"
                            ? "bg-rose-950/40 border-rose-800/40 text-neutral-100 rounded-tr-xs"
                            : "bg-[#161616] border-neutral-800 text-neutral-200 rounded-tl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>

                        {/* AI Reasoning Badge */}
                        {m.reasoning && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-200 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px] text-purple-400">
                              <Brain className="w-3.5 h-3.5 text-purple-400" />
                              <span>Personalized Reasoning</span>
                            </div>
                            <p className="text-[10px] text-neutral-300 leading-normal">{m.reasoning}</p>
                          </div>
                        )}

                        {/* Interactive Cards Container */}
                        {m.cards && m.cards.length > 0 && (
                          <div className="mt-3 space-y-2.5">
                            {m.cards.map((card, cIdx) => (
                              <div key={cIdx} className="bg-[#1A1A1A] border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 shadow-md space-y-2.5 transition-all">
                                {card.cardType === "show_card" && (
                                  <>
                                    <div className="flex gap-3">
                                      <img src={card.poster} alt={card.movieTitle} className="w-16 h-24 object-cover rounded-lg border border-neutral-750 flex-shrink-0" />
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-1">
                                          <h4 className="font-bold text-neutral-100 text-xs truncate">{card.movieTitle}</h4>
                                          <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 flex-shrink-0">★ {card.rating}</span>
                                        </div>
                                        <p className="text-[10px] text-rose-400 font-medium">{card.genre} • {card.language}</p>
                                        <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                                          <span className="truncate">{card.theatreName} ({card.format})</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-neutral-300 font-mono pt-0.5">
                                          <span>{card.date} @ {card.time}</span>
                                          <span className="font-bold text-emerald-400">₹{card.price}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="pt-1 border-t border-neutral-800">
                                      <button
                                        onClick={() => {
                                          setIsOpen(false);
                                          navigate(`/show/${card.showId}/seats`);
                                        }}
                                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer text-center flex items-center justify-center gap-1"
                                      >
                                        <span>Book Now</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </>
                                )}

                                {card.cardType === "movie_card" && (
                                  <>
                                    <div className="flex gap-3">
                                      <img src={card.poster} alt={card.title} className="w-16 h-24 object-cover rounded-lg border border-neutral-750 flex-shrink-0" />
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-bold text-neutral-100 text-xs truncate">{card.title}</h4>
                                          <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">★ {card.rating}</span>
                                        </div>
                                        <p className="text-[10px] text-rose-400 font-medium">{card.genre} • {card.language}</p>
                                        <p className="text-[10px] text-neutral-400 line-clamp-2">{card.overview}</p>
                                      </div>
                                    </div>
                                    <div className="pt-1 border-t border-neutral-800">
                                      <button
                                        onClick={() => {
                                          setIsOpen(false);
                                          navigate(`/movies/${card.tmdbId || card.movieId || card.id}`);
                                        }}
                                        className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors border border-neutral-700 cursor-pointer text-center"
                                      >
                                        Find Shows
                                      </button>
                                    </div>
                                  </>
                                )}

                                {card.cardType === "booking_card" && (
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-bold text-white text-xs">{card.movieTitle}</h4>
                                        <p className="text-[10px] text-neutral-400">{card.theatreName} • Seats: {card.seats}</p>
                                      </div>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${card.status === 'booked' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                        {card.status}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                                      <Calendar className="w-3 h-3 text-rose-500" />
                                      <span>{card.date} @ {card.time}</span>
                                    </div>
                                    <div className="flex gap-1.5 pt-2 border-t border-neutral-800">
                                      <button
                                        onClick={() => handleSend(`I want to cancel booking ${card.bookingId}`)}
                                        className="flex-1 py-1 bg-rose-950/30 border border-rose-800/40 text-rose-400 hover:text-white rounded-lg text-[9px] font-bold uppercase transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSend(`Reschedule booking ${card.bookingId}`)}
                                        className="flex-1 py-1 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-[9px] font-bold uppercase transition-colors"
                                      >
                                        Reschedule
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {card.cardType === "refund_card" && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-bold text-white text-xs">{card.movieTitle}</h4>
                                        <p className="text-[10px] text-neutral-400">{card.theatreName} • ID: {card.bookingId}</p>
                                      </div>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                        card.status === 'REFUNDED'
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : card.status === 'REFUND FAILED'
                                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      }`}>
                                        {card.status}
                                      </span>
                                    </div>

                                    <div className="text-[10px] text-neutral-300 flex justify-between items-center font-mono">
                                      <span>Seats: {card.seats}</span>
                                      <span className="font-bold text-emerald-400">Refund Amount: ₹{card.refundAmount}</span>
                                    </div>

                                    {card.date && card.time && (
                                      <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                                        <Calendar className="w-3 h-3 text-rose-500" />
                                        <span>{card.date} @ {card.time}</span>
                                      </div>
                                    )}

                                    <div className="pt-2 border-t border-neutral-800">
                                      {card.status === 'REFUND PENDING' && (
                                        <button
                                          onClick={() => handleSend(`Track refund for booking ${card.bookingId}`)}
                                          className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                                        >
                                          Track Refund
                                        </button>
                                      )}

                                      {card.status === 'REFUNDED' && (
                                        <button
                                          onClick={() => handleSend(`Show refund details for booking ${card.bookingId}`)}
                                          className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                                        >
                                          View Refund Details
                                        </button>
                                      )}

                                      {card.status === 'REFUND FAILED' && (
                                        <button
                                          onClick={() => handleSend(`Contact support for refund ${card.bookingId}`)}
                                          className="w-full py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                                        >
                                          Contact Support
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Integrated Payment Action Card */}
                        {m.action === "navigate" && m.payload && (
                          <div className="mt-2.5 pt-2 border-t border-neutral-750">
                            <button
                              onClick={() => {
                                if (m.bookingId) {
                                  localStorage.setItem('cv_active_booking_id', m.bookingId);
                                }
                                setIsOpen(false);
                                navigate(m.payload);
                              }}
                              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                            >
                              <span>Complete Payment</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      {m.timestamp && (
                        <p className={`text-[9px] font-mono text-neutral-500 ${m.role === "user" ? "text-right" : "text-left"}`}>
                          {m.timestamp}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Minimal Loader */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2 items-center text-[11px] text-neutral-400 font-medium pl-8 py-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>{statusText}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* 3. FOOTER & INPUT AREA */}
            <div className="flex-shrink-0 z-20 border-t border-neutral-800/80 bg-[#121212] p-3 space-y-2.5 relative">
              
              {/* Horizontal Scrollable Action Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                {((messages[messages.length - 1]?.chips && messages[messages.length - 1]?.chips.length > 0)
                  ? messages[messages.length - 1].chips
                  : suggestedActions.map(a => ({ label: a.label, query: a.query, icon: a.icon }))
                ).map((action, idx) => {
                  const Icon = action.icon || Sparkles;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(action.query)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
                    >
                      <Icon className="w-3 h-3 text-rose-400 flex-shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Input Form Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder="Ask CineVerse AI..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={loading}
                  className="grow bg-[#161616] border border-neutral-800 focus:border-rose-900/60 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-none placeholder-neutral-500 transition-all focus:ring-1 focus:ring-rose-500/20"
                />
                
                <button
                  type="submit"
                  disabled={loading || !inputVal.trim()}
                  className="w-9 h-9 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 disabled:opacity-30 border border-rose-500/20 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIBuddy;
