# CineVerse AI Booking Agent Documentation

This document explains the architecture, design principles, and step-by-step workflow of the **CineVerse AI Booking Agent**.

---

## 1. Core Goal & Role Division

The AI Booking Agent acts as an intelligent conversational agent that collects required booking parameters, performs backend validation step-by-step, and redirects the user to complete payment.

### Separation of Responsibilities

- **Gemini (LLM) Responsibility**:
  - Understand natural language user messages
  - Extract entities (`movie`, `theatre`, `showDate`, `showTime`, `seatCount`)
  - Formulate natural conversational replies explaining the current booking step
  - **NEVER** validate movies/theatres/dates/seats in prompt logic or access DB directly

- **Backend Responsibility**:
  - Perform real database queries via backend tools
  - Validate movie existence (`searchMovieTool`)
  - Validate scheduled theatres for movie (`getMovieTheatresTool`)
  - Validate available show dates (`searchAvailableDatesTool`)
  - Validate scheduled showtimes (`searchShowTimesTool`)
  - Reserve seats & handle lock duration (`reserveSeatsTool`)
  - Navigation & payment payload creation

---

## 2. Booking Session State

The agent maintains a lightweight session state:

```javascript
{
  movie,          // Selected movie title / ID
  theatre,        // Selected theatre name / ID
  showDate,       // Show date (YYYY-MM-DD)
  showTime,       // Showtime string
  showId,         // Selected Show ID
  seatCount,      // Number of seats to book
  selectedSeats,  // Array of seat names (e.g. ["A1", "A2"])
  pendingStep     // Current step ("SELECT_MOVIE", "SELECT_THEATRE", "SELECT_DATE", "SELECT_SHOWTIME", "SHOW_SELECTED", "COMPLETED")
}
```

---

## 3. Step-by-Step Booking Workflow

```
User Input ("Book Interstellar")
       │
       ▼
1. Extract Entities
   (movie = "Interstellar")
       │
       ▼
2. Evaluate Missing Information
   ├─ Movie specified? YES
   ├─ Theatre specified? NO
   └─ Decision: Need Theatre
       │
       ▼
3. Run Backend Tool
   `getMovieTheatresTool(movieId)`
       │
       ▼
4. Response Formatter
   (Build Theatre Cards)
       │
       ▼
5. User Selects Theatre ("PVR Cinemas")
       │
       ▼
6. Evaluate Missing Information
   ├─ Movie specified? YES
   ├─ Theatre specified? YES
   ├─ Date specified? NO
   └─ Decision: Need Date
       │
       ▼
7. Run Backend Tool
   `searchAvailableDatesTool(movieId, theatreId)`
       │
       ▼
8. User Selects Date ("2026-07-23")
       │
       ▼
9. Run Backend Tool
   `searchShowTimesTool(movieId, theatreId, date)` -> Returns Show Cards
       │
       ▼
10. User Selects Showtime -> Redirect to Seat Layout (`/booking/:showId`)
```

---

## 4. LangGraph Nodes Architecture

```
┌───────────────────┐     ┌────────────────┐     ┌──────────────────────┐     ┌───────────────┐
│ intentDetect &    │────▶│ BookingTool    │────▶│ ResponseFormatter    │────▶│ Responder     │
│ entityExtract     │     │ Node (Agent)   │     │ Node                 │     │ Node          │
└───────────────────┘     └────────────────┘     └──────────────────────┘     └───────────────┘
```

1. **Intent & Entity Extraction**: Identifies booking intent and extracts movie/theatre/date parameters.
2. **Booking Tool Node (`bookingAgent.js`)**: Evaluates the session state sequentially, identifies missing information, and invokes the appropriate backend tool.
3. **Response Formatter Node**: Transforms tool results into UI cards (movie cards, theatre cards, date chips, show cards).
4. **Responder Node**: Generates natural conversational responses encouraging user interaction.

---

## 5. Interview Notes — How to Explain This Project

- **Q: Why separate the AI Agent logic into `bookingAgent.js`?**
  - *Answer*: To maintain modularity and single responsibility. The graph acts as the linear orchestrator, while `bookingAgent.js` encapsulates the decision-making rules for missing parameter detection and backend tool selection.

- **Q: How does the agent prevent hallucination?**
  - *Answer*: LLM is strictly restricted to intent classification and entity extraction. Movie lists, theatre schedules, available dates, and showtimes are fetched directly from MongoDB via backend tools.

- **Q: What happens if a user skips steps (e.g. "Book Interstellar at PVR for tomorrow")?**
  - *Answer*: Entity extraction captures `movie`, `theatre`, and `showDate` in a single turn. The planner evaluates all extracted parameters, skips the theatre and date selection prompts, and directly queries available showtimes (`searchShowTimesTool`).
