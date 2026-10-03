import type { NextRequest } from "next/server";
import { deleteThread, getThread, listThreads } from "@/lib/server/coach/threads";
import { isAuthed, isJson, json, serverError } from "@/lib/server/http";

const ID = /^[a-z0-9-]{6,64}$/;

/** GET ?ctx=dsa|sd[&mode=] → recent conversations; GET ?id= → one conversation. */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  const p = req.nextUrl.searchParams;
  try {
    const id = p.get("id");
    if (id) {
      if (!ID.test(id)) return json({ error: "Invalid id" }, 400);
      const t = await getThread(id);
      return t ? json({ thread: { id: t._id, ctx: t.ctx, mode: t.mode, title: t.title, ref: t.ref, messages: t.messages } }) : json({ error: "Not found" }, 404);
    }
    const ctx = p.get("ctx") === "sd" ? "sd" : "dsa";
    const mode = p.get("mode") ?? undefined;
    const rows = await listThreads(ctx, mode);
    return json({ threads: rows.map((t) => ({ id: t._id, title: t.title, mode: t.mode, updatedAt: t.updatedAt })) });
  } catch (err) {
    return serverError(err);
  }
}

/** DELETE { id } */
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  if (!isJson(req)) return json({ error: "Expected JSON" }, 415);
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id || !ID.test(body.id)) return json({ error: "Invalid id" }, 400);
  try {
    await deleteThread(body.id);
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
