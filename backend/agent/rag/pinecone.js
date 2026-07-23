const { Pinecone } = require("@pinecone-database/pinecone");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
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
      embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: "embedding-001",
      });
      console.log("Pinecone index initialized successfully");
    } catch (err) {
      console.error(
        "Error initializing Pinecone index, falling back to Mongo:",
        err.message,
      );
    }
  }
};

const mongoose = require("mongoose");

const storePreference = async (userId, preferenceText, extractedMetadata = {}) => {
  if (!userId || !preferenceText) return;

  const { genre, language, mood } = extractedMetadata || {};
  const createdAt = Date.now();
  const vectorCategoryKey = genre ? "genre" : language ? "language" : mood ? "mood" : "preference";

  // 1. Always update MongoDB as local backup/fallback
  if (mongoose.Types.ObjectId.isValid(userId)) {
    try {
      if (genre) {
        await UserPreference.findOneAndUpdate(
          { userId },
          { $pull: { preferences: { $regex: "(horror|action|comedy|thriller|romance|drama|sci-fi|family|crime)", $options: "i" } } }
        );
      }
      await UserPreference.findOneAndUpdate(
        { userId },
        { $addToSet: { preferences: preferenceText } },
        { upsert: true }
      );
    } catch (err) {
      console.error("Error saving preference to MongoDB:", err.message);
    }
  }

  // 2. Upsert Vector Embedding to Pinecone using fixed category ID so new preference replaces old (Step 6)
  if (pineconeIndex && embeddings) {
    try {
      const vector = await embeddings.embedQuery(preferenceText);
      await pineconeIndex.upsert([
        {
          id: `${userId}-${vectorCategoryKey}`,
          values: vector,
          metadata: {
            userId: userId.toString(),
            genre: genre || "",
            language: language || "",
            mood: mood || "",
            text: preferenceText,
            createdAt,
          },
        },
      ]);
    } catch (err) {
      console.error("Error upserting vector to Pinecone:", err.message);
    }
  }
};

const retrievePreferences = async (userId, currentQuery = "") => {
  if (!userId) return [];

  // Step 1: If Pinecone is available, generate embedding for query & search top 3 vectors filtered by userId
  if (pineconeIndex && embeddings) {
    try {
      const searchPrompt = currentQuery && currentQuery.trim() !== ""
        ? currentQuery
        : "user movie preference genre language mood";
      const queryVector = await embeddings.embedQuery(searchPrompt);

      const queryResponse = await pineconeIndex.query({
        vector: queryVector,
        topK: 3,
        includeMetadata: true,
        filter: { userId: userId.toString() },
      });

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        // Sort matches by createdAt descending so latest preference takes precedence (Step 6)
        const matches = queryResponse.matches
          .map((m) => ({
            text: m.metadata.text,
            genre: m.metadata.genre,
            language: m.metadata.language,
            mood: m.metadata.mood,
            createdAt: m.metadata.createdAt || 0,
            score: m.score,
          }))
          .sort((a, b) => b.createdAt - a.createdAt);

        return matches;
      }
    } catch (err) {
      console.error("Pinecone query error, falling back to Mongo:", err.message);
    }
  }

  // Step 1 Fallback: Query local MongoDB cache if Pinecone is unavailable
  let localPrefs = [];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const doc = await UserPreference.findOne({ userId });
      if (doc && doc.preferences) {
        localPrefs = doc.preferences.map((p) => ({ text: p }));
      }
    } catch (err) {
      console.error("Error reading preferences from Mongo:", err.message);
    }
  }

  return localPrefs;
};

// Initialize connection immediately
initPinecone();

module.exports = {
  storePreference,
  retrievePreferences,
};
