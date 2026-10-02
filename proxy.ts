import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/server/session";

/** Everything requires a session except the login page and the login/logout endpoints. */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const authed = verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return authed ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|woff2?)$).*)"],
};
