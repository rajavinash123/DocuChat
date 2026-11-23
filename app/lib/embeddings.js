import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { ChatGroq } from "@langchain/groq";

let model;
let embeddings;

export function getModel() {
  if (!model) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    model = new ChatGroq({
      model: "openai/gpt-oss-120b",
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return model;
}

export function getEmbeddings() {
  if (!embeddings) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    embeddings = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-001",
      apiKey: process.env.GOOGLE_API_KEY,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    });
  }

  return embeddings;
}