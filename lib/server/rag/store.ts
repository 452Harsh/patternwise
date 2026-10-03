import "server-only";
import type { Collection } from "mongodb";
import { embeddingModel } from "@/lib/ai";
import { COLLECTIONS, db } from "../db";
import { knowledgeDocs, type KnowledgeDoc, type KnowledgeModule } from "./knowledge";

/**
 * Retrieval layer. The default store is MongoDB Atlas Vector Search ($vectorSearch) on the
 * `knowledge` collection; it falls back to in-process cosine similarity over the stored vectors
 * (e.g. while the Atlas index is building), and to keyword scoring when no embedding model is
 * reachable. Swap `VectorStore` to move to another vector database.
 */

export const VECTOR_INDEX = "knowledge_vector";

export interface KnowledgeHit {
  id: string;
  title: string;
  href: string;
  contentType: KnowledgeDoc["contentType"];
  content: string;
  score: number;
}

export interface SearchOptions {
  module: KnowledgeModule;
  contentTypes?: KnowledgeDoc["contentType"][];
  k?: number;
}

export interface VectorStore {
  name: string;
  search(vector: number[], opts: SearchOptions): Promise<KnowledgeHit[]>;
}

type StoredDoc = Omit<KnowledgeDoc, "documentId"> & { _id: string; embedding: number[]; embedModel: string; createdAt: Date; updatedAt: Date };

export async function knowledgeCollection(): Promise<Collection<StoredDoc>> {
  return (await db()).collection<StoredDoc>(COLLECTIONS.knowledge);
}

const toHit = (d: Pick<StoredDoc, "_id" | "title" | "href" | "contentType" | "content">, score: number): KnowledgeHit => ({
  id: d._id,
  title: d.title,
  href: d.href,
  contentType: d.contentType,
  content: d.content,
  score,
});

export const atlasVectorStore: VectorStore = {
  name: "atlas-vector-search",
  async search(vector, { module, contentTypes, k = 5 }) {
    const col = await knowledgeCollection();
    const filter: Record<string, unknown> = { module };
    if (contentTypes?.length) filter.contentType = { $in: contentTypes };
    const rows = await col
      .aggregate<StoredDoc & { score: number }>([
        { $vectorSearch: { index: VECTOR_INDEX, path: "embedding", queryVector: vector, numCandidates: Math.max(100, k * 20), limit: k, filter } },
        { $project: { title: 1, href: 1, contentType: 1, content: 1, score: { $meta: "vectorSearchScore" } } },
      ])
      .toArray();
    return rows.map((r) => toHit(r, r.score));
  },
};

/* ---------- in-process fallback ---------- */

const g = globalThis as unknown as { _kvectors?: Map<string, Promise<Pick<StoredDoc, "_id" | "title" | "href" | "contentType" | "content" | "embedding">[]>> };

export function invalidateVectorCache() {
  g._kvectors?.clear();
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export const memoryVectorStore: VectorStore = {
  name: "in-memory-vectors",
  async search(vector, { module, contentTypes, k = 5 }) {
    g._kvectors ??= new Map();
    if (!g._kvectors.has(module)) {
      g._kvectors.set(
        module,
        knowledgeCollection().then((col) =>
          col.find({ module }, { projection: { title: 1, href: 1, contentType: 1, content: 1, embedding: 1 } }).toArray(),
        ),
      );
    }
    const docs = await g._kvectors.get(module)!;
    return docs
      .filter((d) => !contentTypes?.length || contentTypes.includes(d.contentType))
      .map((d) => toHit(d, cosine(vector, d.embedding)))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  },
};

/* ---------- keyword fallback (no embedding model available) ---------- */

const STOP = new Set("a an and are as at be by can do does for from how i in is it my of on or the this to what when why with you your".split(" "));
const terms = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g)?.filter((t) => t.length > 1 && !STOP.has(t)) ?? [];

export function keywordSearch(query: string, { module, contentTypes, k = 5 }: SearchOptions): KnowledgeHit[] {
  const q = [...new Set(terms(query))];
  if (!q.length) return [];
  return knowledgeDocs()
    .filter((d) => d.module === module && (!contentTypes?.length || contentTypes.includes(d.contentType)))
    .map((d) => {
      const title = terms(d.title);
      const body = terms(d.content);
      const score = q.reduce((s, t) => s + (title.includes(t) ? 3 : 0) + Math.min(3, body.filter((b) => b === t).length) * 0.5, 0);
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ d, score }) => ({ id: d.documentId, title: d.title, href: d.href, contentType: d.contentType, content: d.content, score }));
}

/* ---------- entry point ---------- */

export type RetrievalMethod = "atlas-vector-search" | "in-memory-vectors" | "keyword" | "none";

export async function retrieve(query: string, opts: SearchOptions): Promise<{ hits: KnowledgeHit[]; method: RetrievalMethod }> {
  let vector: number[] | null = null;
  try {
    [vector] = await embeddingModel().embed([query], "query");
  } catch {
    vector = null;
  }
  if (vector) {
    try {
      const hits = await atlasVectorStore.search(vector, opts);
      if (hits.length) return { hits, method: "atlas-vector-search" };
    } catch {
      // Index missing, still building, or not an Atlas cluster: use the stored vectors directly.
    }
    try {
      const hits = await memoryVectorStore.search(vector, opts);
      if (hits.length) return { hits, method: "in-memory-vectors" };
    } catch {
      // fall through to keywords
    }
  }
  const hits = keywordSearch(query, opts);
  return { hits, method: hits.length ? "keyword" : "none" };
}
