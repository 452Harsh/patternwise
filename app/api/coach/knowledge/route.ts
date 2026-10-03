import type { NextRequest } from "next/server";
import { AIUnavailableError } from "@/lib/ai/types";
import { buildKnowledgeIndex } from "@/lib/server/rag/indexer";
import { isAuthed, isJson, json, serverError } from "@/lib/server/http";

export const maxDuration = 300;

/** POST → (re)build the global knowledge index from the curriculum. Incremental. */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  if (!isJson(req)) return json({ error: "Expected JSON" }, 415);
  try {
    return json(await buildKnowledgeIndex());
  } catch (err) {
    if (err instanceof AIUnavailableError) return json({ error: err.message }, 503);
    return serverError(err);
  }
}
