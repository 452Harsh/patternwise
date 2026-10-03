import "server-only";
import { COLLECTIONS, db } from "../db";

/** Coach conversations and saved plans. Private user data: never indexed into the global knowledge base. */

export interface ThreadMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface ThreadDoc {
  _id: string;
  ctx: "dsa" | "sd";
  mode: string;
  title: string;
  ref?: Record<string, unknown>;
  messages: ThreadMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MAX_MESSAGES = 80;

export async function saveThread(t: Omit<ThreadDoc, "createdAt" | "updatedAt">) {
  const col = (await db()).collection<ThreadDoc>(COLLECTIONS.coachThreads);
  const now = new Date();
  await col.updateOne(
    { _id: t._id },
    { $set: { ctx: t.ctx, mode: t.mode, title: t.title, ref: t.ref, messages: t.messages.slice(-MAX_MESSAGES), updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
}

export async function listThreads(ctx: "dsa" | "sd", mode?: string) {
  const col = (await db()).collection<ThreadDoc>(COLLECTIONS.coachThreads);
  const filter = mode ? { ctx, mode } : { ctx };
  return col
    .find(filter, { projection: { title: 1, mode: 1, ctx: 1, updatedAt: 1 } })
    .sort({ updatedAt: -1 })
    .limit(30)
    .toArray();
}

export async function getThread(id: string) {
  return (await db()).collection<ThreadDoc>(COLLECTIONS.coachThreads).findOne({ _id: id });
}

export async function deleteThread(id: string) {
  await (await db()).collection<ThreadDoc>(COLLECTIONS.coachThreads).deleteOne({ _id: id });
}

/* ---------- saved daily plans ---------- */

export interface PlanDoc {
  _id: string;
  plan: unknown;
  explanations?: Partial<Record<"dsa" | "sd", string>>;
  updatedAt: Date;
}

export async function savePlanDoc(date: string, plan: unknown) {
  const col = (await db()).collection<PlanDoc>(COLLECTIONS.coachPlans);
  // A regenerated plan invalidates the old explanations.
  await col.updateOne({ _id: date }, { $set: { plan, explanations: {}, updatedAt: new Date() } }, { upsert: true });
}

export async function getPlanDoc(date: string) {
  return (await db()).collection<PlanDoc>(COLLECTIONS.coachPlans).findOne({ _id: date });
}

export async function savePlanExplanation(date: string, ctx: "dsa" | "sd", text: string) {
  await (await db()).collection<PlanDoc>(COLLECTIONS.coachPlans).updateOne({ _id: date }, { $set: { [`explanations.${ctx}`]: text, updatedAt: new Date() } });
}
