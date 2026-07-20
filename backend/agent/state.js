const { Annotation } = require("@langchain/langgraph");
// Ye LangGraph ki Annotation class import kar rahi hai.
// Iske through hum state ke har field ko define karte hain.

// ye LangGraph ka State Schema hai. Isme define hota hai ki AI Agent ko conversation ke dauran kya-kya yaad rakhna hai aur jab multiple nodes state update karein to values kaise merge hongi.
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
    default: () => [], // jab convo start hoti to movie ka wo null rehta val
  }),
  intent: Annotation({
    reducer: (x, y) => y ?? x,// Purani value aur nayi value me se kis ko rakhna hai. ye decide krta h
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
  extractedEntities: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
});

module.exports = AgentState;
