import "server-only";
import { AIUnavailableError, type EmbeddingModel } from "../types";

/**
 * Embeddings from Hugging Face Inference (e.g. google/embeddinggemma-300m), for deployments that
 * can't run a local embedding model. Same model as local Ollama → vectors stay compatible with the index.
 */
export function huggingFaceEmbeddings(model: string, apiKey?: string, baseUrl = "https://router.huggingface.co/hf-inference"): EmbeddingModel {
  return {
    provider: "huggingface",
    model,
    async embed(texts, kind) {
      // EmbeddingGemma task prefixes, identical to the Ollama provider.
      const inputs = texts.map((t) => (kind === "query" ? `task: search result | query: ${t}` : `title: none | text: ${t}`));
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/models/${model}/pipeline/feature-extraction`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
          body: JSON.stringify({ inputs, normalize: true }),
        });
      } catch {
        throw new AIUnavailableError("Can't reach Hugging Face Inference.");
      }
      if (!res.ok) throw new AIUnavailableError(`Hugging Face ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      const data = (await res.json()) as number[][] | number[][][];
      // Some models return token-level vectors; mean-pool them if so.
      return (data as unknown[]).map((row) => {
        const r = row as number[] | number[][];
        if (typeof r[0] === "number") return r as number[];
        const tokens = r as number[][];
        const out = new Array<number>(tokens[0].length).fill(0);
        for (const t of tokens) for (let i = 0; i < t.length; i++) out[i] += t[i] / tokens.length;
        const norm = Math.hypot(...out) || 1;
        return out.map((x) => x / norm);
      });
    },
  };
}
