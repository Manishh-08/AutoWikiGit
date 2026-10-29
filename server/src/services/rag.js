import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { search } from "./vectorStore.js";

const llm = new ChatOpenAI({
  model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

function toText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part.text ?? ""))
      .join("");
  }
  return String(content ?? "");
}

export async function askQuestion(repo, question, topK = 5) {
  const docs = await search(repo, question, topK);

  if (!docs.length) {
    return {
      answer: "No indexed content was found for this repo. Index it first, then try again.",
      sources: [],
    };
  }

  const context = docs
    .map((doc) => `File: ${doc.metadata.path}\n${doc.pageContent}`)
    .join("\n\n");

  const response = await llm.invoke(
    `Answer using this repo context only.\n\n${context}\n\nQuestion: ${question}`,
  );

  return {
    answer: toText(response.content),
    sources: [...new Set(docs.map((doc) => doc.metadata.path).filter(Boolean))],
  };
}