import "server-only";
import { AIUnavailableError, type ChatMessage, type ChatModel, type ChatOptions, type EmbeddingModel } from "../types";

/**
 * Open-weight models served by Ollama (https://ollama.com), via its native API: locally, or on a
 * remote server behind a proxy that checks `Authorization: Bearer <AI_API_KEY>`.
 */

const authHeaders = (apiKey?: string): Record<string, string> => (apiKey ? { Authorization: `Bearer ${apiKey}` } : {});

async function call(baseUrl: string, path: string, body: unknown, signal?: AbortSignal, apiKey?: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(apiKey) },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new AIUnavailableError(`Can't reach Ollama at ${baseUrl}. Is it running? (ollama serve)`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AIUnavailableError(`Ollama ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

export function ollamaChat(baseUrl: string, model: string, numCtx: number, apiKey?: string): ChatModel {
  return {
    provider: "ollama",
    model,
    async *stream(messages: ChatMessage[], opts: ChatOptions = {}) {
      const res = await call(
        baseUrl,
        "/api/chat",
        {
          model,
          messages,
          stream: true,
          think: false,
          keep_alive: "15m",
          options: { temperature: opts.temperature ?? 0.4, num_ctx: numCtx, num_predict: opts.maxTokens ?? 900 },
        },
        opts.signal,
        apiKey,
      );
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          const chunk = JSON.parse(line) as { message?: { content?: string }; error?: string; done?: boolean };
          if (chunk.error) throw new AIUnavailableError(chunk.error);
          if (chunk.message?.content) yield chunk.message.content;
        }
      }
    },
    async health() {
      try {
        const res = await fetch(`${baseUrl}/api/tags`, { headers: authHeaders(apiKey), signal: AbortSignal.timeout(4000) });
        if (res.status === 401 || res.status === 403) return { ok: false, detail: "The model server rejected the API key (check AI_API_KEY)" };
        const data = (await res.json()) as { models?: { name: string }[] };
        const names = (data.models ?? []).map((m) => m.name);
        const has = names.some((n) => n === model || n === `${model}:latest`);
        const where = /localhost|127\.0\.0\.1/.test(baseUrl) ? "locally" : `on ${new URL(baseUrl).host}`;
        return has ? { ok: true, detail: `Running ${where} with Ollama` } : { ok: false, detail: `Model not pulled. Run: ollama pull ${model}` };
      } catch {
        return { ok: false, detail: `Ollama isn't running at ${baseUrl}. Start it with: ollama serve` };
      }
    },
  };
}

export function ollamaEmbeddings(baseUrl: string, model: string, apiKey?: string): EmbeddingModel {
  return {
    provider: "ollama",
    model,
    async embed(texts, kind) {
      // EmbeddingGemma is trained with task prefixes; other models ignore them harmlessly.
      const input = texts.map((t) => (kind === "query" ? `task: search result | query: ${t}` : `title: none | text: ${t}`));
      const res = await call(baseUrl, "/api/embed", { model, input, keep_alive: "15m" }, undefined, apiKey);
      const data = (await res.json()) as { embeddings: number[][] };
      return data.embeddings;
    },
  };
}
