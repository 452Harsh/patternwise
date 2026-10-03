import "server-only";
import { embeddingModel } from "@/lib/ai";
import { knowledgeDocs } from "./knowledge";
import { VECTOR_INDEX, invalidateVectorCache, knowledgeCollection } from "./store";

const BATCH = 16;

export interface IndexResult {
  total: number;
  embedded: number;
  unchanged: number;
  removed: number;
  dimensions: number | null;
  vectorIndex: "created" | "exists" | "unavailable";
  vectorIndexDetail?: string;
}

/**
 * Embed the curriculum knowledge and upsert it into the `knowledge` collection.
 * Incremental: only documents whose text or embedding model changed are re-embedded.
 */
export async function buildKnowledgeIndex(onProgress?: (done: number, todo: number) => void): Promise<IndexResult> {
  const col = await knowledgeCollection();
  const embedder = embeddingModel();
  const docs = knowledgeDocs();
  const existing = new Map(
    (await col.find({}, { projection: { hash: 1, embedModel: 1 } }).toArray()).map((d) => [d._id, d]),
  );
  const todo = docs.filter((d) => {
    const prev = existing.get(d.documentId);
    return !prev || prev.hash !== d.hash || prev.embedModel !== embedder.model;
  });

  let dimensions: number | null = null;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const vectors = await embedder.embed(batch.map((d) => `${d.title}\n\n${d.content}`), "document");
    dimensions ??= vectors[0]?.length ?? null;
    const now = new Date();
    await col.bulkWrite(
      batch.map(({ documentId, ...rest }, j) => ({
        updateOne: {
          filter: { _id: documentId },
          update: { $set: { ...rest, embedding: vectors[j], embedModel: embedder.model, updatedAt: now }, $setOnInsert: { createdAt: now } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    onProgress?.(Math.min(i + BATCH, todo.length), todo.length);
  }

  const ids = docs.map((d) => d.documentId);
  const { deletedCount } = await col.deleteMany({ _id: { $nin: ids } });
  if (dimensions === null) {
    const one = await col.findOne({}, { projection: { embedding: 1 } });
    dimensions = one?.embedding?.length ?? null;
  }
  invalidateVectorCache();

  let vectorIndex: IndexResult["vectorIndex"] = "unavailable";
  let vectorIndexDetail: string | undefined;
  if (dimensions) {
    try {
      const indexes = await col.listSearchIndexes(VECTOR_INDEX).toArray();
      const current = indexes[0] as { latestDefinition?: { fields?: { numDimensions?: number }[] } } | undefined;
      const dims = current?.latestDefinition?.fields?.find((f) => f.numDimensions)?.numDimensions;
      const definition = {
        fields: [
          { type: "vector", path: "embedding", numDimensions: dimensions, similarity: "cosine" },
          { type: "filter", path: "module" },
          { type: "filter", path: "contentType" },
        ],
      };
      if (!current) {
        await col.createSearchIndex({ name: VECTOR_INDEX, type: "vectorSearch", definition });
        vectorIndex = "created";
      } else {
        if (dims !== dimensions) await col.updateSearchIndex(VECTOR_INDEX, definition);
        vectorIndex = "exists";
      }
    } catch (err) {
      vectorIndexDetail = err instanceof Error ? err.message.slice(0, 200) : String(err);
    }
  }

  return {
    total: docs.length,
    embedded: todo.length,
    unchanged: docs.length - todo.length,
    removed: deletedCount,
    dimensions,
    vectorIndex,
    vectorIndexDetail,
  };
}

export async function knowledgeStatus() {
  const col = await knowledgeCollection();
  const [count, model] = await Promise.all([col.estimatedDocumentCount(), col.findOne({}, { projection: { embedModel: 1 } })]);
  let index: string = "missing";
  try {
    const idx = (await col.listSearchIndexes(VECTOR_INDEX).toArray())[0] as { status?: string } | undefined;
    index = idx ? (idx.status ?? "unknown").toLowerCase() : "missing";
  } catch {
    index = "unsupported";
  }
  return { documents: count, expected: knowledgeDocs().length, embedModel: model?.embedModel ?? null, index };
}
