import type { NextRequest } from "next/server";
import { isAuthed, isJson, json, serverError } from "@/lib/server/http";
import { applyPatch, loadState } from "@/lib/server/repo";
import { PatchSchema } from "@/lib/server/schemas";

/** GET: the full saved state. */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  try {
    return json(await loadState());
  } catch (err) {
    return serverError(err);
  }
}

/** PATCH: apply a validated change set (see PatchSchema). */
export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  if (!isJson(req)) return json({ error: "Expected JSON" }, 415);
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid data", issues: parsed.error.issues.slice(0, 5) }, 400);
  }
  try {
    await applyPatch(parsed.data);
    return json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return serverError(err);
  }
}
