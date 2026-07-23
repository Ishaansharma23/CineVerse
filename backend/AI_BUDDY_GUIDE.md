# CineVerse AI Buddy — How It Works

This guide explains the complete AI chatbot system step by step.

---

## What is LangGraph and Why Do We Use It?

LangGraph is a framework for building AI workflows as a **graph of nodes** connected by **edges**.

Think of it like an assembly line in a factory:

```
Raw Material → Station 1 → Station 2 → Station 3 → Station 4 → Station 5 → Finished Product
```

In our case:

```
User Message → Intent Detection → Entity Extraction → Tool Router → Formatter → Responder → AI Reply
```

### Why not just use if-else?

Without LangGraph, our code would look like one massive function doing everything. LangGraph lets us split the work into 5 clean steps (nodes), where each step does ONE job and passes its result to the next step through a shared **state object**.

### What is State?

State is a shared JavaScript object that flows through all 5 nodes. Every node can read from it and write to it. It holds everything: the user's message, detected intent, extracted movie name, API results, formatted cards, and the final response.

The state is defined in `state.js` using LangGraph's `Annotation` system. Each field has a `reducer` that decides whether to keep the old value or accept the new one.

---

## The 5-Node Pipeline

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌────────────┐    ┌─────────────┐
│ intentDetect │───▶│  entityExtract   │───▶│  toolRouter  │───▶│ formatter  │───▶│  responder  │
│              │    │                  │    │              │    │            │    │             │
│ "What does   │    │ "Pull out movie  │    │ "Call the    │    │ "Build UI  │    │ "Generate   │
│  the user    │    │  name, theatre,  │    │  right       │    │  cards &   │    │  natural    │
│  want?"      │    │  date, genre"    │    │  backend     │    │  chips"    │    │  language   │
│              │    │                  │    │  tool"       │    │            │    │  reply"     │
└──────────────┘    └──────────────────┘    └──────────────┘    └────────────┘    └─────────────┘
```

---

## Node 1: Intent Detection (`intentDetectNode`)

**File:** `graph.js`

**Job:** Figure out WHAT the user wants.

**How it works:**

1. Grabs the last user message
2. First checks for hardcoded keyword matches (fast path):
   - "refund status" → `refund_status`
   - "refund" / "money back" → `refund`
3. If no match, sends the message to **Gemini LLM** with the `INTENT_CLASSIFICATION_PROMPT`
4. Gemini returns JSON like `{ "intent": "booking" }`
5. If Gemini fails, falls back to keyword matching (cancel, history, trending, recommend, book)
6. Also handles the **confirmation workflow** — if a refund/cancel was pending and user says "yes"/"no"

**Possible intents:**

| Intent | Triggered By |
|---|---|
| `booking` | "Book Obsession", "Show me movies" |
| `cancellation` | "Cancel my ticket" |
| `refund` | "I want a refund", "Refund my booking" |
| `refund_status` | "Check refund status" |
| `booking_history` | "Show my bookings" |
| `recommendation` | "Recommend movies", "Suggest something" |
| `trending_movies` | "What's trending?" |
| `general_chat` | "Hi", "What is your refund policy?" |

**Writes to state:** `intent`, `pendingConfirmation`, `confirmedAction`

---

## Node 2: Entity Extraction (`entityExtractNode`)

**File:** `graph.js`

**Job:** Extract structured data from the user message.

**How it works:**

1. Sends the user message to **Gemini LLM** with `ENTITY_EXTRACTION_PROMPT`
2. Gemini returns JSON like:
```json
{
  "movie": "Obsession",
  "theatre": null,
  "date": "2026-07-22",
  "genre": "Horror",
  "language": "Hindi",
  "bookingId": null,
  "seatCount": 2
}
```
3. If Gemini fails, uses **regex fallback** to extract bookingId (`CV-12345`) and seatCount
4. Also does a **DB lookup** — checks if any active movie title appears in the user's message
5. Detects **user preferences** — if the message contains phrases like "I like", "I love", "I prefer", it flags `preferenceDetected = true`

**Writes to state:** `movie`, `theatre`, `showDate`, `genre`, `language`, `mood`, `bookingId`, `seatCount`, `preferenceDetected`, `preferenceText`

---

## Node 3: Tool Router (`toolRouterNode`)

**File:** `graph.js`

**Job:** Call the right backend tool based on the detected intent.

**How it works:**

1. If a user preference was detected, saves it to Pinecone via `saveUserPreferenceTool()`
2. Looks up the intent in the `intentHandlers` object (a registry/dictionary)
3. Calls the matching handler function
4. Each handler calls one or more backend tools and returns a `{ status, data }` object

### Intent Handler → Backend Tool Mapping

| Intent | Handler | Backend Tools Called |
|---|---|---|
| `booking` | `intentHandlers.booking` | `searchMovieTool()` → `getMovieTheatresTool()` → `searchAvailableDatesTool()` → `searchShowTimesTool()` |
| `trending_movies` | `intentHandlers.trending_movies` | `searchTrendingMoviesTool()` |
| `recommendation` | `intentHandlers.recommendation` | `retrieveUserPreferenceTool()` → `recommendMoviesTool()` |
| `booking_history` | `intentHandlers.booking_history` | `getBookingHistoryTool()` |
| `refund` | `intentHandlers.refund` | `getEligibleCancellationBookingsTool()` or `cancelBookingTool()` |
| `cancellation` | `intentHandlers.cancellation` | `getEligibleCancellationBookingsTool()` or `cancelBookingTool()` |
| `refund_status` | `intentHandlers.refund_status` | `getRefundStatusTool()` |
| `general_chat` | `intentHandlers.general_chat` | `GeneralChatTool()` |

**Writes to state:** `status`, `data`, `pendingConfirmation`

---

## Node 4: Response Formatter (`responseFormatterNode`)

**File:** `graph.js`

**Job:** Convert raw database results into UI-ready cards and chips.

**How it works:**

Checks what type of data came back and builds the appropriate card type:

| Data Contains | Card Type Built | Example |
|---|---|---|
| `data.movies` | `movie_card` | Movie poster, title, genre, rating |
| `data.theatres` | `theatre_card` | Theatre name |
| `data.availableDates` | Chips only | "MON Jul 22", "TUE Jul 23" |
| `data.shows` | `show_card` | Showtime, price, screen type |
| `data.candidates` | `movie_card` | Recommended movies |
| `data.bookings` | `booking_card` | Booking ID, seats, status |
| `data.refundBookings` | `refund_card` | Refund amount, status |

Also generates `reasoning` text (the message shown above cards) and `chips` (quick action buttons).

If a show was selected (`showId` exists), creates a navigation payload to redirect the user to `/booking/:showId`.

**Writes to state:** `sanitizedData`, `cards`, `reasoning`, `chips`, `actionRequired`

---

## Node 5: Responder (`responderNode`)

**File:** `graph.js`

**Job:** Generate a natural language reply using Gemini.

**How it works:**

1. For refund/cancellation flows, returns the `reasoning` text directly (no LLM call needed)
2. For everything else, sends the structured data to **Gemini** with the `ASSISTANT_SYSTEM_PROMPT`
3. Gemini turns the structured data into a friendly conversational response
4. If Gemini fails, falls back to the `reasoning` text

**Writes to state:** `messages` (the final assistant reply), `cards`, `reasoning`, `chips`, `actionRequired`

---

## Complete Booking Flow Example

User says: **"Book Obsession for today"**

```
Node 1 (intentDetect)
├─ Detects: intent = "booking"

Node 2 (entityExtract)
├─ Gemini extracts: movie = "Obsession", date = "2026-07-22"
├─ DB lookup confirms "Obsession" exists

Node 3 (toolRouter)
├─ Calls intentHandlers.booking(state)
├─ movie = "Obsession" exists, theatre = null
├─ Calls searchMovieTool("Obsession") → finds the movie
├─ Calls getMovieTheatresTool(movieId) → finds theatres with shows
├─ Returns: status = "SELECT_THEATRE", data = { movies, theatres }

Node 4 (formatter)
├─ Builds theatre_card[] from data.theatres
├─ Sets reasoning = "Select a cinema showing Obsession."
├─ Sets chips = ["PVR Cinemas", "INOX", ...]

Node 5 (responder)
├─ Gemini generates: "I found Obsession! Here are the cinemas showing it. Pick one to continue."
├─ Returns: { message, cards, chips }
```

User then says: **"PVR Cinemas"**

```
Node 1 → intent = "booking" (carried from state)
Node 2 → theatre = "PVR Cinemas"
Node 3 → movie exists, theatre exists, showDate = null
       → Calls searchAvailableDatesTool(movieId, "PVR Cinemas")
       → Returns available dates as chips
Node 4 → Formats date chips
Node 5 → "Choose a date for Obsession at PVR Cinemas."
```

User then says: **"July 23"**

```
Node 1 → intent = "booking"
Node 2 → showDate = "2026-07-23"
Node 3 → movie, theatre, showDate all present
       → Calls searchShowTimesTool(movieId, theatre, date)
       → Returns show cards with times and prices
Node 4 → Builds show_card[] with showId, time, price
Node 5 → "Found 3 showtimes for Obsession at PVR on Jul 23."
```

User clicks a show card → Frontend navigates to `/booking/:showId` → Seat selection page.

---

## Recommendation Flow with Pinecone

### Saving Preferences

When user says **"I like Horror movies"**:

```
Node 2 (entityExtract)
├─ Detects "I like" → preferenceDetected = true
├─ preferenceText = "User Preference: I like Horror movies"

Node 3 (toolRouter)
├─ Calls saveUserPreferenceTool(userId, preferenceText)
├─ Inside pinecone.js:
│  ├─ Saves text to MongoDB (backup)
│  └─ Generates embedding → Upserts vector to Pinecone
│     with metadata: { userId, genre: "Horror", text, createdAt }
```

### Retrieving Preferences

When user later says **"Recommend movies"**:

```
Node 3 (toolRouter) → intentHandlers.recommendation
├─ genre/language/mood from current message = all null
├─ Calls retrieveUserPreferenceTool(userId, "Recommend movies")
│  ├─ Inside pinecone.js → retrievePreferences():
│  │  ├─ Generates embedding for "Recommend movies"
│  │  ├─ Queries Pinecone: topK=3, filter: { userId }
│  │  └─ Returns vector matches with metadata
│  ├─ Parses matches → finds genre = "Horror"
│  └─ Returns: { genre: "Horror", language: null, mood: null }
├─ Merges: current (null) + saved ("Horror") → genre = "Horror"
├─ recommendationType = "SAVED_PREFERENCES"
├─ Calls recommendMoviesTool(userId, { genre: "Horror" })
│  └─ MongoDB: Movie.find({ isActive: true, genres: /Horror/i })
└─ Returns Horror movies
```

### Priority Rule

```
Current explicit request  >  Saved Pinecone preference  >  Popular movies fallback
```

Example: Stored = Horror, User says "Recommend Hindi movies"
→ Merged = { genre: "Horror", language: "Hindi" }

---

## Refund / Cancellation Flow

User says: **"I want a refund"**

```
Node 1 → intent = "refund"
Node 3 → intentHandlers.refund
       → No bookingId provided
       → Calls getEligibleCancellationBookingsTool(userId)
          └─ Finds bookings where:
             bookingStatus = "booked"
             paymentStatus = "paid"
             show is in the future
             refund window is still open (>2 hours before show)
       → Returns eligible bookings as booking_card[]
Node 4 → Formats booking cards with Cancel/Refund buttons
Node 5 → "Select an eligible booking to request a refund."
```

User clicks a booking card (e.g., CV-123456):

```
Node 1 → intent = "refund", bookingId = "CV-123456"
Node 3 → bookingId exists, confirmedAction = false
       → Returns: "Are you sure you want to cancel CV-123456?"
       → Sets pendingConfirmation = "confirm_refund"
```

User says: **"Yes"**

```
Node 1 → pendingConfirmation active, "yes" detected
       → confirmedAction = true
Node 3 → bookingId + confirmedAction = true
       → Calls cancelBookingTool(userId, "CV-123456")
          ├─ Validates ownership
          ├─ Calculates refund amount
          ├─ Processes Razorpay refund
          ├─ Updates booking status to "cancelled"
          ├─ Unlocks seats via Redis
          ├─ Emits socket event for real-time seat updates
          └─ Sends refund confirmation email
       → Returns: { success: true, refundAmount: 250 }
```

---

## All Backend Tools (backendTools.js)

| Tool | What It Does | Called By |
|---|---|---|
| `searchMovieTool(query)` | Searches movies by title/genre in MongoDB. Strips filler words from natural language queries. | Booking, Trending, Recommendation |
| `searchTrendingMoviesTool()` | Returns top 10 active movies sorted by popularity + rating. | Trending intent |
| `getMovieTheatresTool(movieId)` | Finds theatres with scheduled shows for a movie (queries Show → Screen → Theatre). | Booking flow Step 1 |
| `searchAvailableDatesTool(movieId, theatreId)` | Returns future dates with scheduled shows for a movie at a theatre. | Booking flow Step 2 |
| `searchShowTimesTool(movieId, theatreId, date)` | Returns showtimes for a movie at a theatre on a specific date. | Booking flow Step 3 |
| `getSeatLayoutTool(showId)` | Returns seat grid with booked/locked/available status. | Seat selection, Reserve |
| `reserveSeatsTool(userId, showId, count)` | Finds adjacent seats, locks them in Redis, creates pending booking. | Booking confirmation |
| `cancelBookingTool(userId, bookingId)` | Cancels booking, processes Razorpay refund, unlocks seats, sends email. | Refund & Cancellation |
| `getBookingHistoryTool(userId)` | Returns all bookings for a user sorted by latest first. | Booking History |
| `getEligibleCancellationBookingsTool(userId)` | Returns only bookings eligible for cancel (booked + paid + future + refund window open). | Refund & Cancellation |
| `getRefundStatusTool(userId, bookingId)` | Returns refund status for cancelled bookings. | Refund Status |
| `rescheduleBookingTool(userId, oldBookingId, newShowId)` | Moves booking to a new show, transfers seats. | Reschedule |
| `retrieveUserPreferenceTool(userId, query)` | Queries Pinecone for saved preferences, parses genre/language/mood. | Recommendation |
| `recommendMoviesTool(userId, preferences)` | Queries MongoDB for movies matching genre/language/mood filters. | Recommendation |
| `saveUserPreferenceTool(userId, text, metadata)` | Saves user preference to Pinecone + MongoDB. | Preference detection |
| `GeneralChatTool()` | Returns static CineVerse platform info (policies, rules, capabilities). | General Chat |

---

## File Structure

```
backend/agent/
├── graph.js            ← The 5-node LangGraph pipeline (the brain)
├── state.js            ← State schema (shared data between nodes)
├── prompts.js          ← System prompts for Gemini LLM
├── tools/
│   └── backendTools.js ← All database tools (MongoDB queries, Razorpay, Redis)
└── rag/
    └── pinecone.js     ← Pinecone vector DB for storing/retrieving preferences

backend/controllers/
└── aiController.js     ← Express route handler — the entry point
                          Creates/loads Redis session → calls graph.invoke() → returns response
```

---

## How the Entry Point Works (aiController.js)

1. User sends POST `/api/ai/chat` with `{ message: "Book Obsession" }`
2. `aiController` loads the Redis session (or creates a new one)
3. Pushes the user message into `session.messages`
4. Calls `graph.invoke(state)` — this runs all 5 nodes in sequence
5. Reads the result, updates the session state in Redis
6. Returns JSON to frontend: `{ message, cards, chips, reasoning, action, payload }`

---

## Key Concepts Summary

| Concept | What It Means |
|---|---|
| **Node** | A function that does one job (detect intent, extract entities, call tools, format cards, generate reply) |
| **Edge** | Connects nodes in order — data flows from one node to the next |
| **State** | A shared object that all nodes read from and write to |
| **Reducer** | A rule for each state field — "keep old value" or "overwrite with new value" |
| **Intent** | What the user wants to do (book, cancel, refund, recommend, etc.) |
| **Entity** | Specific details extracted from the message (movie name, date, genre, bookingId) |
| **Tool** | A backend function that queries MongoDB, Redis, Razorpay, or Pinecone |
| **Card** | A UI component sent to the frontend (movie card, show card, booking card) |
| **Chip** | A quick-action button in the chat UI ("Book Obsession", "PVR Cinemas") |
| **Reasoning** | The text message displayed above the cards |
