const { Pinecone } = require("@pinecone-database/pinecone");
const { GoogleGenAIEmbeddings } = require("@langchain/google-genai");
const UserPreference = require("../../models/UserPreference");

let pineconeIndex = null;
let embeddings = null;

const initPinecone = async () => {
  if (
    process.env.PINECONE_API_KEY &&
    process.env.PINECONE_INDEX &&
    process.env.GEMINI_API_KEY
  ) {
    try {
      const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
      pineconeIndex = pc.index(process.env.PINECONE_INDEX);
      embeddings = new GoogleGenAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: "embedding-001",
      });
      console.log("Pinecone index initialized successfully");
    } catch (err) {
      console.error("Error initializing Pinecone index, falling back to Mongo:", err.message);
    }
  }
};

const storePreference = async (userId, preferenceText) => {
  // Always update MongoDB as local backup/fallback
  try {
    await UserPreference.findOneAndUpdate(
      { userId },
      { $addToSet: { preferences: preferenceText } },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error saving preference to MongoDB:", err);
  }

  // If Pinecone is configured, upsert vector embedding
  if (pineconeIndex && embeddings) {
    try {
      const vector = await embeddings.embedQuery(preferenceText);
      await pineconeIndex.upsert([
        {
          id: `${userId}-${Date.now()}`,
          values: vector,
          metadata: { userId: userId.toString(), text: preferenceText },
        },
      ]);
    } catch (err) {
      console.error("Error upserting vector to Pinecone:", err);
    }
  }
};

const retrievePreferences = async (userId) => {
  // Query local MongoDB cache
  let localPrefs = [];
  try {
    const doc = await UserPreference.findOne({ userId });
    if (doc) localPrefs = doc.preferences;
  } catch (err) {
    console.error("Error reading preferences from Mongo:", err);
  }

  // If Pinecone is configured, we could query vector database if query text is provided
  // But for simple personalization context, listing all user preferences from Mongo/Pinecone is preferred
  return localPrefs;
};

// Initialize connection immediately
initPinecone();

module.exports = {
  storePreference,
  retrievePreferences,
};
