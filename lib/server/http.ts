import "server-only";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Like `json`, but compressed (brotli, else gzip) when the client accepts it. Used for the large
 * full-state response: ~500 KB of JSON shrinks ~10x. Hosts don't re-compress an encoded body.
 */
export function compressedJson(req: NextRequest, body: unknown, headers: Record<string, string> = {}) {
  const raw = Buffer.from(JSON.stringify(body));
  const accept = req.headers.get("accept-encoding") ?? "";
  const base = { "Content-Type": "application/json", "Cache-Control": "no-store", Vary: "Accept-Encoding", ...headers };
  if (raw.length < 1024) return new NextResponse(raw, { headers: base });
  if (/\bbr\b/.test(accept)) {
    const out = brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } });
    return new NextResponse(out, { headers: { ...base, "Content-Encoding": "br" } });
  }
  if (/\bgzip\b/.test(accept)) return new NextResponse(gzipSync(raw, { level: 6 }), { headers: { ...base, "Content-Encoding": "gzip" } });
  return new NextResponse(raw, { headers: base });
}

export const isAuthed = (req: NextRequest) => verifySession(req.cookies.get(SESSION_COOKIE)?.value);

/** Only accept JSON bodies: blocks cross-site form posts (CSRF) since JSON requires a CORS preflight. */
export const isJson = (req: NextRequest) => (req.headers.get("content-type") ?? "").startsWith("application/json");

export function serverError(err: unknown) {
  console.error("[api]", err);
  return json({ error: "Server error" }, 500);
}
