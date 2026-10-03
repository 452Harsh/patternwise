import "server-only";
import { AIUnavailableError, type ChatMessage, type ChatModel, type ChatOptions, type EmbeddingModel } from "../types";

/**
 * Any server that speaks the OpenAI-compatible API while hosting an open-weight model:
 * vLLM, llama.cpp server, LM Studio, Ollama's /v1, or a hosted inference provider.
 */

function headers(apiKey?: string) {
  return { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) };
}

async function post(url: string, body: unknown, apiKey?: string, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: headers(apiKey), body: JSON.stringify(body), signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new AIUnavailableError(`Can't reach the model server at ${new URL(url).origin}.`);
  }
  if (!res.ok) throw new AIUnavailableError(`Model server ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return res;
}

/**
 * Some hosted Gemma 4 endpoints always reason first and stream it inline as `<thought>…</thought>`,
 * with no way to switch it off. Drop that block so only the answer reaches the user.
 */
export async function* withoutThoughts(chunks: AsyncIterable<string>): AsyncIterable<string> {
  const OPEN = "<thought>";
  const CLOSE = "</thought>";
  let state: "start" | "thinking" | "trim" | "answer" = "start";
  let buf = "";
  for await (const c of chunks) {
    if (state === "answer") {
      yield c;
      continue;
    }
    if (state === "trim") {
      // Drop the whitespace between the closing tag and the answer, even across chunks.
      const t = c.trimStart();
      if (t) {
        state = "answer";
        yield t;
      }
      continue;
    }
    buf += c;
    if (state === "start") {
      const lead = buf.trimStart();
      if (lead.length < OPEN.length && OPEN.startsWith(lead)) continue; // can't tell yet
      if (!lead.startsWith(OPEN)) {
        state = "answer";
        yield buf;
        buf = "";
        continue;
      }
      state = "thinking";
      buf = lead.slice(OPEN.length);
    }
    const end = buf.indexOf(CLOSE);
    if (end === -1) {
      buf = buf.slice(-CLOSE.length); // keep a tail in case the tag is split across chunks
      continue;
    }
    const rest = buf.slice(end + CLOSE.length).trimStart();
    buf = "";
    state = rest ? "answer" : "trim";
    if (rest) yield rest;
  }
  if (state === "start" && buf) yield buf;
}

/** Fold system instructions into the first user turn, for servers that reject the system role. */
function foldSystem(messages: ChatMessage[]): ChatMessage[] {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const rest = messages.filter((m) => m.role !== "system");
  if (!system) return rest;
  const i = rest.findIndex((m) => m.role === "user");
  if (i === -1) return [{ role: "user", content: system }, ...rest];
  return rest.map((m, j) => (j === i ? { ...m, content: `${system}\n\n---\n\n${m.content}` } : m));
}

/** Servers/models known to reject the system role, remembered for the process lifetime. */
const NO_SYSTEM = new Set<string>();

export function openAIChat(baseUrl: string, model: string, apiKey?: string): ChatModel {
  const id = `${baseUrl}|${model}`;
  return {
    provider: "openai-compatible",
    model,
    stream(messages: ChatMessage[], opts: ChatOptions = {}) {
      return withoutThoughts(raw(messages, opts));
    },
    health,
  };

  async function* raw(messages: ChatMessage[], opts: ChatOptions): AsyncIterable<string> {
    // Headroom for models that reason before answering (the reasoning is stripped, the answer still fits).
    const send = (msgs: ChatMessage[]) =>
      post(`${baseUrl}/chat/completions`, { model, messages: msgs, stream: true, temperature: opts.temperature ?? 0.4, max_tokens: (opts.maxTokens ?? 900) + 1024 }, apiKey, opts.signal);
    let res: Response;
    try {
      res = await send(NO_SYSTEM.has(id) ? foldSystem(messages) : messages);
    } catch (err) {
      // e.g. "Developer instruction is not enabled for models/gemma-…": retry without a system turn.
      if (NO_SYSTEM.has(id) || !(err instanceof AIUnavailableError) || !/400/.test(err.message) || !/instruction|system/i.test(err.message)) throw err;
      NO_SYSTEM.add(id);
      res = await send(foldSystem(messages));
    }
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
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        const chunk = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    }
  }

  async function health() {
    try {
      const res = await fetch(`${baseUrl}/models`, { headers: headers(apiKey), signal: AbortSignal.timeout(4000) });
      return res.ok ? { ok: true, detail: `Connected to ${new URL(baseUrl).host}` } : { ok: false, detail: `Model server returned ${res.status}` };
    } catch {
      return { ok: false, detail: `Can't reach ${baseUrl}` };
    }
  }
}

export function openAIEmbeddings(baseUrl: string, model: string, apiKey?: string): EmbeddingModel {
  return {
    provider: "openai-compatible",
    model,
    async embed(texts) {
      const res = await post(`${baseUrl}/embeddings`, { model, input: texts }, apiKey);
      const data = (await res.json()) as { data: { embedding: number[]; index: number }[] };
      return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    },
  };
}
