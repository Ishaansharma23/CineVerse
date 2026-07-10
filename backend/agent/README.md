# CineVerse AI Buddy Assistant (LangGraph & Pinecone)

Welcome to the **CineVerse Autonomous Booking Assistant**! This module implements a state-of-the-art conversational chatbot layer on top of your MERN application, leveraging **LangChain**, **LangGraph**, and **Pinecone RAG**.

---

## 📂 Folder Directory Layout

```
backend/
├── agent/
│   ├── graph.js             # Core workflow compilation using LangGraph StateGraph
│   ├── state.js             # Unified AgentState channel annotation definition
│   ├── prompts.js           # Systems and LLM instructions modular templates
│   ├── rag/
│   │   └── pinecone.js      # Vector database connection and personalization fallback
│   └── tools/
│       └── backendTools.js  # Wrapper calling controller databases and seat locks
├── controllers/
│   └── aiController.js      # Manages session memory caches and executions
└── routes/
    └── aiRoutes.route.js    # Routes chat messages through auth protect middleware
```

---

## 🛠️ Configuration & Setup

Add the following environment variables to your backend `backend/.env` file:

```env
# Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Pinecone configuration (Personalization RAG memory)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=cineverse-index
```

> [!NOTE]
> If `PINECONE_API_KEY` is not provided, the AI Buddy will automatically detect it and **fallback gracefully to MongoDB** (`UserPreference` schema) to store and retrieve long-term user preferences without crashing!

---

## 🔄 Shared Agent State Schema

The shared state object propagates variables between workflow nodes dynamically:

* `userId`: Mongoose ObjectId of the authenticated customer.
* `sessionId`: Client-side persistent local session ID.
* `messages`: Cumulative conversation history context array.
* `intent`: Resolved intent (`booking`, `cancellation`, `refund`, `reschedule`, `recommendation`, `booking_history`, `general_chat`).
* `movie`: Movie query string or matching name.
* `theatre`: Cinema location or name query.
* `showDate` / `showTime`: Showtime matching slots parameters.
* `showId`: Resolved matching show document identifier.
* `bookingId`: Target reference identifier for cancellations, rescheduling, and refund queries.
* `selectedSeats`: Allocated seats array (e.g. `A4, A5`).
* `seatCount`: Number of requested tickets.
* `actionRequired`: Special frontend instructions (e.g. `{"type": "navigate", "payload": "/checkout"}`).

---

## 🚀 Future Additions

It is extremely easy to plug in additional nodes and edges to support future workflows:
1. **Food Ordering Node**: Add a node `foodOrdering` to scan snacks, retrieve choices, add to checkout totals.
2. **Loyalty Program**: Add a tool `validateLoyaltyPoints` checking membership points.
3. **Wallet node**: Complete payments using wallet balance state checks.
