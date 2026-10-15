import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_ROUTE, SESSION_COOKIE_NAME } from "@/constants";

/** Routes reachable without a session. Everything else is gated. */
const PUBLIC_ROUTES = new Set<string>([LOGIN_ROUTE]);

/**
 * Optimistic auth gate.
 *
 * This runs on every request, including prefetches, so it only checks whether
 * a session cookie is *present* — no signature checks, no network calls. The
 * authoritative verification happens in `libs/dal.ts`, close to the data.
 *
 * Presence may only be used to *deny*, never to *grant*. The absence of a
 * cookie definitively means there is no session, so redirecting to /login is
 * sound. Presence says nothing about validity, so this must not redirect a
 * cookie-holder away from /login: a stale or revoked cookie would bounce off
 * the DAL's redirect back to here, and the two would loop forever with no way
 * for the user to reach the sign-in form. That bounce lives in
 * `app/login/page.tsx`, where the session is actually verified.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const isPublic = PUBLIC_ROUTES.has(pathname);

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals, the favicon, and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
