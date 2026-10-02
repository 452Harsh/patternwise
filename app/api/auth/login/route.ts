import type { NextRequest } from "next/server";
import { z } from "zod";
import { isJson, json } from "@/lib/server/http";
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, createSession } from "@/lib/server/session";

const Body = z.object({ password: z.string().min(1).max(200) });

// Simple in-memory brute-force guard: 5 failures per IP locks login for 15 minutes.
const attempts = new Map<string, { count: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
  if (!isJson(req)) return json({ error: "Expected JSON" }, 415);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const rec = attempts.get(ip);
  if (rec && rec.count >= MAX_FAILS && rec.until > Date.now()) {
    return json({ error: "Too many attempts. Try again in a few minutes." }, 429);
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !checkPassword(parsed.data.password)) {
    const next = rec && rec.until > Date.now() ? rec.count + 1 : 1;
    attempts.set(ip, { count: next, until: Date.now() + LOCK_MS });
    return json({ error: "Wrong password" }, 401);
  }

  attempts.delete(ip);
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
