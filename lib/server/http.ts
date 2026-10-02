import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const isAuthed = (req: NextRequest) => verifySession(req.cookies.get(SESSION_COOKIE)?.value);

/** Only accept JSON bodies: blocks cross-site form posts (CSRF) since JSON requires a CORS preflight. */
export const isJson = (req: NextRequest) => (req.headers.get("content-type") ?? "").startsWith("application/json");

export function serverError(err: unknown) {
  console.error("[api]", err);
  return json({ error: "Server error" }, 500);
}
