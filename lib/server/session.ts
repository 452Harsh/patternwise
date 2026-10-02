import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed session for a single-user app:
 * cookie value = base64url(JSON payload) + "." + HMAC-SHA256(payload, SESSION_SECRET).
 * Used by both proxy.ts and route handlers (both run on the Node.js runtime).
 */
export const SESSION_COOKIE = "pw_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters) in .env.local.");
  return s;
}

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function createSession(): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/** Constant-time comparison against APP_PASSWORD (hashing first equalises lengths). */
export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD is not set in .env.local.");
  const a = createHmac("sha256", "pw").update(input).digest();
  const b = createHmac("sha256", "pw").update(expected).digest();
  return timingSafeEqual(a, b);
}
