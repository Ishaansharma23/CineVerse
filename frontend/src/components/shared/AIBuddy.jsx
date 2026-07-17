import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MessageSquare, X, Send, Sparkles, User, Bot, ArrowRight } from "lucide-react";
import request from "../../services/api";
import toast from "react-hot-toast";

const AIBuddy = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    // Initial greeting message
    const greetingName = isAuthenticated && user ? user.name : "Guest";
    const greetingText = isAuthenticated 
      ? `Hi ${greetingName}! 👋 I'm your CineVerse AI Buddy. You can chat with me naturally to book shows, recommend movies, reschedule, or check refunds. Try one of the suggestions below!`
      : `Hi Guest! 👋 I'm your CineVerse AI Buddy. Please Sign In using the button at the top right to book shows, check history, or reschedule tickets!`;

    setMessages([
      {
        role: "assistant",
        content: greetingText,
      },
    ]);
  }, [user, isAuthenticated]);

  useEffect(() => {
    // Auto scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const query = text || inputVal;
    if (!query.trim()) return;

    setInputVal("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);

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
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 cursor-pointer group relative overflow-hidden active:scale-95 animate-pulse"
        >
          <div className="absolute inset-0 bg-white/10 group-hover:scale-105 transition-transform duration-200" />
          <MessageSquare className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
          {/* Sparkle Badge */}
          <span className="absolute -top-1 -right-1 bg-amber-500 text-[8px] font-extrabold uppercase px-1 rounded-full text-black flex items-center gap-0.5 border border-black animate-bounce">
            <Sparkles className="w-2 h-2" /> AI
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] md:w-[400px] h-[550px] bg-[#121212]/90 border border-neutral-900 bg-gradient-to-b from-[#121212]/95 to-[#0A0A0A]/95 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl relative scale-in-center">
          {/* Header */}
          <div className="p-4 border-b border-neutral-900 bg-[#1A1A1A]/70 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-rose-600/10 border border-rose-600/20 text-rose-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-100 flex items-center gap-1.5">
                  CineVerse AI Buddy
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                </h3>
                <p className="text-[10px] text-neutral-500 font-semibold uppercase mt-0.5 tracking-wide">Autonomous Booking Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-500 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages List Area */}
          <div className="grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-900">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs border ${
                    m.role === "user"
                      ? "bg-purple-600/10 border-purple-500/20 text-purple-400"
                      : "bg-rose-600/10 border-rose-500/20 text-rose-400"
                  }`}
                >
                  {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble text content */}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed border ${
                    m.role === "user"
                      ? "bg-purple-950/15 border-purple-500/10 text-neutral-100 rounded-tr-none"
                      : "bg-neutral-900/60 border-neutral-850 text-neutral-200 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}

            {/* Typing Loader Indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 bg-rose-600/10 border border-rose-500/20 text-rose-450 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-neutral-900/60 border border-neutral-850 max-w-[70%] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-3 bg-neutral-950/40 border-t border-neutral-900/40 space-y-2">
            <p className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Suggested Actions</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  disabled={loading}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-neutral-950 border-t border-neutral-900 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI Buddy (e.g. reschedule show)..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={loading}
              className="grow bg-[#141414] border border-neutral-850 focus:border-rose-650 rounded-xl px-3.5 py-2 text-xs font-semibold text-neutral-200 outline-none placeholder-neutral-700"
            />
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="w-10 h-10 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIBuddy;
