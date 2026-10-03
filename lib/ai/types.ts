/**
 * Model-agnostic AI interfaces. The coach only talks to these; concrete providers
 * (local Ollama, any OpenAI-compatible server hosting an open-weight model, …) plug in behind them.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ChatModel {
  /** Provider id, e.g. "ollama". */
  provider: string;
  /** Model id, e.g. "gemma4:e2b-it-qat". */
  model: string;
  /** Streams the assistant's reply as text chunks. */
  stream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<string>;
  /** Is the backing server reachable and the model available? */
  health(): Promise<{ ok: boolean; detail: string }>;
}

export interface EmbeddingModel {
  provider: string;
  model: string;
  /** One vector per input text, same order. */
  embed(texts: string[], kind: "document" | "query"): Promise<number[][]>;
}

export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIUnavailableError";
  }
}
