import "server-only";

import { redirect } from "next/navigation";

import { LOGIN_ROUTE } from "@/constants";
import { getAdminAuth } from "@/libs/firebase/admin";
import { readSessionCookie } from "@/libs/session";

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

/**
 * Resolves the current user, or null when there is no valid session.
 *
 * `use cache: private` is required rather than optional: a plain `use cache`
 * scope cannot call `cookies()`, and with `cacheComponents` enabled an
 * uncached session read outside a <Suspense> boundary is a build error. A
 * private scope caches per-request in the browser and never on the server.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  "use cache: private";

  const cookie = await readSessionCookie();
  if (!cookie) return null;

  const adminAuth = getAdminAuth();

  try {
    // checkRevoked: removeSession() revokes refresh tokens on sign-out, but
    // without this flag a session cookie issued before that revocation still
    // verifies — so signing out in one browser left other browsers signed in.
    // Costs a round-trip to Firebase; the `use cache: private` scope above
    // holds it to once per request.
    const decoded = await adminAuth.verifySessionCookie(cookie, true);

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_ROUTE);
  return user;
}
