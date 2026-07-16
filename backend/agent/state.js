const { Annotation } = require("@langchain/langgraph");

const AgentState = Annotation.Root({
  userId: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  sessionId: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  messages: {
    reducer: (x, y) => x.concat(y),
    default: () => [],
  },
  intent: {
    reducer: (x, y) => y ?? x,
    default: () => "general_chat",
  },
  movie: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  theatre: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  showDate: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  showTime: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  showId: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  bookingId: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  paymentStatus: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  refundStatus: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  selectedSeats: {
    reducer: (x, y) => y ?? x,
    default: () => [],
  },
  seatCount: {
    reducer: (x, y) => y ?? x,
    default: () => 1,
  },
  recommendationContext: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  actionRequired: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  genre: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  language: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  audience: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  mood: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
  similarMovie: {
    reducer: (x, y) => y ?? x,
    default: () => null,
  },
});

module.exports = AgentState;
