const { Annotation } = require("@langchain/langgraph");

/**
 * CineVerse Agent State Schema
 * Simplified for orchestration: Intent -> Entity -> Tool Router -> Formatter -> Responder
 */
const AgentState = Annotation.Root({
  userId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  sessionId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  intent: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "general_chat",
  }),
  movie: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  theatre: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  showDate: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  showTime: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  showId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  bookingId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  genre: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  language: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  mood: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  location: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  seatCount: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 1,
  }),
  pendingConfirmation: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  confirmedAction: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  status: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  data: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  sanitizedData: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  actionRequired: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => true,
  }),
  cards: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  reasoning: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  chips: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
});

module.exports = AgentState;
