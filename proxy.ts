import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_ROUTE, SESSION_COOKIE_NAME } from "@/constants";

const PUBLIC_ROUTES = new Set<string>([LOGIN_ROUTE]);
// Routes that carry their own credential (a bearer token) rather than the
// session cookie, so the gate below must not redirect them to /login.
const SELF_AUTHENTICATED_ROUTES = new Set<string>([
  "/api/jobs",
  "/api/health/auth",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const isPublic =
    PUBLIC_ROUTES.has(pathname) || SELF_AUTHENTICATED_ROUTES.has(pathname);

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
