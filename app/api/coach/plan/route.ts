import type { NextRequest } from "next/server";
import { z } from "zod";
import { buildCoachPlan, prefsOf } from "@/lib/coach/plan";
import { loadUserState } from "@/lib/server/coach/state";
import { getPlanDoc, savePlanDoc } from "@/lib/server/coach/threads";
import { isAuthed, isJson, json, serverError } from "@/lib/server/http";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** GET ?date= → the saved plan for that day (and its explanations), or null. */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  const date = day.safeParse(req.nextUrl.searchParams.get("date"));
  if (!date.success) return json({ error: "Invalid date" }, 400);
  try {
    const doc = await getPlanDoc(date.data);
    return json(doc ? { plan: doc.plan, explanations: doc.explanations ?? {} } : { plan: null, explanations: {} });
  } catch (err) {
    return serverError(err);
  }
}

/** POST { date } → compute today's plan from the stored progress and save it. */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  if (!isJson(req)) return json({ error: "Expected JSON" }, 415);
  const body = z.object({ date: day }).safeParse(await req.json().catch(() => null));
  if (!body.success) return json({ error: "Invalid request" }, 400);
  try {
    const state = await loadUserState();
    const plan = buildCoachPlan(state, body.data.date, prefsOf(state));
    await savePlanDoc(body.data.date, plan);
    return json({ plan, explanations: {} });
  } catch (err) {
    return serverError(err);
  }
}
