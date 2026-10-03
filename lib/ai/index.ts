import "server-only";
import { ollamaChat, ollamaEmbeddings } from "./providers/ollama";
import { huggingFaceEmbeddings } from "./providers/huggingface";
import { openAIChat, openAIEmbeddings } from "./providers/openai-compatible";
import type { ChatModel, EmbeddingModel } from "./types";

/**
 * Provider registry, configured by environment variables. Swapping the model (or moving from a
 * local model to a hosted open-weight one) is a config change, not a code change.
 *
 *   AI_PROVIDER        ollama (default) | openai-compatible
 *   AI_BASE_URL        http://localhost:11434 for Ollama; https://host/v1 for OpenAI-compatible servers
 *   AI_MODEL           gemma4:e2b-it-qat (default)
 *   AI_API_KEY         sent as "Authorization: Bearer …" (hosted servers, or Ollama behind an auth proxy)
 *   AI_NUM_CTX         context window for Ollama (default 8192)
 *   AI_EMBED_PROVIDER  ollama | openai-compatible | huggingface (defaults to AI_PROVIDER)
 *   AI_EMBED_API_KEY   key for the embedding provider (defaults to AI_API_KEY)
 *   AI_EMBED_BASE_URL  defaults to AI_BASE_URL
 *   AI_EMBED_MODEL     embeddinggemma (default)
 */

const env = (k: string) => process.env[k]?.trim() || undefined;

export const AI_CONFIG = {
  provider: env("AI_PROVIDER") ?? "ollama",
  baseUrl: (env("AI_BASE_URL") ?? "http://localhost:11434").replace(/\/$/, ""),
  model: env("AI_MODEL") ?? "gemma4:e2b-it-qat",
  numCtx: Number(env("AI_NUM_CTX") ?? 8192),
  embedProvider: env("AI_EMBED_PROVIDER") ?? env("AI_PROVIDER") ?? "ollama",
  embedBaseUrl: (env("AI_EMBED_BASE_URL") ?? env("AI_BASE_URL") ?? "http://localhost:11434").replace(/\/$/, ""),
  embedModel: env("AI_EMBED_MODEL") ?? "embeddinggemma",
};

export function chatModel(): ChatModel {
  const c = AI_CONFIG;
  if (c.provider === "openai-compatible") return openAIChat(c.baseUrl, c.model, env("AI_API_KEY"));
  return ollamaChat(c.baseUrl, c.model, c.numCtx, env("AI_API_KEY"));
}

export function embeddingModel(): EmbeddingModel {
  const c = AI_CONFIG;
  const key = env("AI_EMBED_API_KEY") ?? env("AI_API_KEY");
  if (c.embedProvider === "huggingface") return huggingFaceEmbeddings(c.embedModel, key);
  if (c.embedProvider === "openai-compatible") return openAIEmbeddings(c.embedBaseUrl, c.embedModel, key);
  return ollamaEmbeddings(c.embedBaseUrl, c.embedModel, key);
}
