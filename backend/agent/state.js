const { Annotation } = require("@langchain/langgraph");

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
  paymentStatus: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  refundStatus: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  selectedSeats: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  seatCount: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 1,
  }),
  recommendationContext: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  actionRequired: Annotation({
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
  audience: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  mood: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  similarMovie: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  pendingAction: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  pendingOptions: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  status: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  nextAction: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  data: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  actionRequired: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => true,
  }),
  sanitizedData: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

module.exports = AgentState;
