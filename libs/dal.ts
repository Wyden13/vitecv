import "server-only";

import { redirect } from "next/navigation";

import { LOGIN_ROUTE } from "@/constants";
import { getAdminAuth } from "@/libs/firebase/admin";
import { readSessionCookie } from "@/libs/session";

/**
 * Narrow view of the signed-in user. Deliberately not the decoded token —
 * only these fields are safe to hand to a component.
 */
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

  // Resolved outside the try: a missing service account is a configuration
  // error and should surface, not masquerade as a signed-out user.
  const adminAuth = getAdminAuth();

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie);

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
    };
  } catch {
    // Expired, revoked, or forged — all mean "not signed in".
    return null;
  }
}

/** Same, but redirects to /login instead of returning null. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_ROUTE);
  return user;
}
