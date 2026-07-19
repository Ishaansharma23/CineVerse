import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MessageSquare, X, Send, Sparkles, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import request from "../../services/api";
import toast from "react-hot-toast";

const AIBuddy = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("Thinking...");

  const chatEndRef = useRef(null);

  useEffect(() => {
    const greetingName = isAuthenticated && user ? user.name : "Guest";
    const greetingText = isAuthenticated 
      ? `Hi ${greetingName}! 👋 I'm your CineVerse AI Buddy. You can chat with me naturally to book shows, recommend movies, reschedule, or check refunds. Try one of the suggestions below!`
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
    // Auto scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Intelligent Status updates cycle
  useEffect(() => {
    if (!loading) {
      setStatusText("Thinking...");
      return;
    }

    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let statusCycle = ["Thinking...", "Searching shows...", "Checking seats...", "Processing request..."];

    if (lastUserMessage.includes("reschedule") || lastUserMessage.includes("cancel") || lastUserMessage.includes("change")) {
      statusCycle = ["Retrieving booking...", "Verifying ticket details...", "Checking seat inventory...", "Updating reservation..."];
    } else if (lastUserMessage.includes("recommend") || lastUserMessage.includes("suggest") || lastUserMessage.includes("what movies") || lastUserMessage.includes("good")) {
      statusCycle = ["Searching movie catalog...", "Analyzing watch patterns...", "Curating matches...", "Finalizing suggestions..."];
    } else if (lastUserMessage.includes("seat") || lastUserMessage.includes("book") || lastUserMessage.includes("show")) {
      statusCycle = ["Retrieving showtimes...", "Checking seats...", "Calculating booking details...", "Preparing reservation..."];
    } else if (lastUserMessage.includes("history") || lastUserMessage.includes("refund")) {
      statusCycle = ["Accessing purchase log...", "Verifying status...", "Connecting to processor...", "Retrieving records..."];
    }

    setStatusText(statusCycle[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % statusCycle.length;
      setStatusText(statusCycle[index]);
    }, 1500);

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

    if (isExpired) {
      const greetingName = isAuthenticated && user ? user.name : "Guest";
      const greetingText = isAuthenticated 
        ? `Hi ${greetingName}! 👋 I'm your CineVerse AI Buddy. You can chat with me naturally to book shows, recommend movies, reschedule, or check refunds. Try one of the suggestions below!`
        : `Hi Guest! 👋 I'm your CineVerse AI Buddy. Please Sign In using the button at the top right to book shows, check history, or reschedule tickets!`;
      setMessages([
        { role: "assistant", content: greetingText },
        { role: "user", content: query }
      ]);
    } else {
      setMessages((prev) => [...prev, { role: "user", content: query }]);
    }

    if (!isAuthenticated) {
      setLoading(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "To chat and reserve tickets with the AI Booking Buddy, please Sign In using the button at the top right of the page!",
          },
        ]);
        setLoading(false);
      }, 600);
      return;
    }

    setLoading(true);

    try {
      const response = await request("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: query }),
      });

      if (response.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
        
        // Handle client-side actions
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
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestionChips = [
    "Book Toy Story for tomorrow",
    "What movies do you recommend?",
    "Show my booking history",
    "Cancel a ticket",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans antialiased text-white">
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: [0, -6, 0] 
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              y: {
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut"
              },
              scale: { type: "spring", stiffness: 260, damping: 20 }
            }}
            whileHover={{ scale: 1.1, boxShadow: "0 0 25px rgba(225,29,72,0.4)" }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 bg-gradient-to-tr from-rose-600 via-pink-600 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.35)] border border-white/20 cursor-pointer group relative overflow-hidden active:scale-95"
          >
            <div className="absolute inset-0 bg-white/10 group-hover:scale-105 transition-transform duration-200" />
            <MessageSquare className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
            {/* Sparkle Badge */}
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full text-black flex items-center gap-0.5 border border-black shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-bounce">
              <Sparkles className="w-2.5 h-2.5 fill-black" /> AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, x: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30, x: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-[360px] md:w-[410px] h-[580px] bg-neutral-950/80 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(225,29,72,0.15)] flex flex-col overflow-hidden backdrop-blur-2xl relative"
          >
            {/* Ambient Background Glows inside panel */}
            <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-rose-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-md flex justify-between items-center z-10 relative">
              <div className="flex items-center gap-3">
                {/* Premium Avatar with pulsing ripple rings */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <motion.span
                    className="absolute inset-0 rounded-full bg-rose-500/25"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full bg-purple-500/20"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.2, 0.7] }}
                    transition={{ repeat: Infinity, duration: 3, delay: 1, ease: "easeInOut" }}
                  />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(225,29,72,0.3)] z-10">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    CineVerse AI Buddy
                    <span className="flex items-center gap-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Agent
                    </span>
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-semibold tracking-wider flex items-center gap-1.5 mt-0.5 uppercase">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Autonomous Booking Agent
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer border border-white/5 hover:border-white/10 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages List Area */}
            <div className="grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent z-10">
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                    className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs border ${
                        m.role === "user"
                          ? "bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-400"
                          : "bg-gradient-to-tr from-rose-500/10 to-purple-500/10 border-rose-500/30 text-rose-400"
                      }`}
                    >
                      {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble text content */}
                    <div
                      className={`max-w-[76%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed border select-text ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-purple-600/90 to-indigo-600/90 border-purple-500/30 text-white rounded-tr-none shadow-[0_4px_12px_rgba(124,58,237,0.15)]"
                          : "bg-white/[0.03] border-white/5 text-neutral-200 rounded-tl-none shadow-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Loader Indicator */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex gap-3 items-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center flex-shrink-0 animate-pulse border border-white/20 shadow-[0_0_10px_rgba(225,29,72,0.2)]">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-3">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-300 font-mono tracking-wider transition-all duration-300">
                        {statusText}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-4 bg-white/[0.01] border-t border-white/5 space-y-2.5 z-10 relative">
              <p className="text-[9px] font-extrabold uppercase text-neutral-500 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-rose-500" /> Suggested Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestionChips.map((chip, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    disabled={loading}
                    whileHover={{ 
                      scale: 1.03, 
                      y: -1, 
                      boxShadow: "0 0 12px rgba(225,29,72,0.15)",
                      borderColor: "rgba(225, 29, 72, 0.4)",
                      color: "#ffffff"
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="px-3 py-1.5 bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 text-neutral-400 rounded-lg text-[10px] font-bold font-mono tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <span className="text-rose-500/70 font-black">&gt;</span> {chip}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input Form Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-4 bg-black/40 border-t border-white/5 flex gap-2.5 items-center z-10 relative"
            >
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Ask AI Buddy (e.g. reschedule show)..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-rose-500/50 rounded-xl px-4 py-2.5 pr-10 text-xs font-semibold text-neutral-200 outline-none placeholder-neutral-600 transition-all duration-300 focus:shadow-[0_0_15px_rgba(225,29,72,0.15)]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
                </div>
              </div>
              <motion.button
                type="submit"
                disabled={loading || !inputVal.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 bg-gradient-to-tr from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 border border-white/10 shadow-[0_2px_8px_rgba(225,29,72,0.2)]"
              >
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIBuddy;
