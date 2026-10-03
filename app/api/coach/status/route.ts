import type { NextRequest } from "next/server";
import { AI_CONFIG, chatModel } from "@/lib/ai";
import { knowledgeStatus } from "@/lib/server/rag/indexer";
import { isAuthed, json } from "@/lib/server/http";

/** Model reachability and knowledge-index state, for the coach's status chip. */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  const [health, knowledge] = await Promise.all([chatModel().health(), knowledgeStatus().catch(() => null)]);
  return json({
    provider: AI_CONFIG.provider,
    model: AI_CONFIG.model,
    embedModel: AI_CONFIG.embedModel,
    ok: health.ok,
    detail: health.detail,
    knowledge,
  });
}
