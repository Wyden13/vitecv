"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  HOME_ROUTE,
  ROOT_ROUTE,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/constants";
import { getAdminAuth } from "@/libs/firebase/admin";
import { getCurrentUser } from "@/libs/dal";
import { readSessionCookie } from "@/libs/session";

export interface SessionError {
  error: string;
}

/**
 * Exchanges a Firebase ID token for a session cookie, then redirects home.
 *
 * Returns `{ error }` instead of throwing so the caller can show the real
 * reason. Next.js redacts thrown server action errors in production to an
 * opaque digest, which previously made a misconfigured deployment (missing
 * or malformed FIREBASE_* vars) look like a button that silently does
 * nothing. The message also lands in the host's runtime logs via
 * `console.error`.
 */
export async function createSession(
  idToken: string,
): Promise<SessionError | void> {
  try {
    const adminAuth = getAdminAuth();

    await adminAuth.verifyIdToken(idToken);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE,
    });

    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE / 1000,
      path: "/",
    });
  } catch (error) {
    console.error("[auth] createSession failed", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create a session.",
    };
  }

  // Outside the try: redirect() signals navigation by throwing NEXT_REDIRECT,
  // so catching it here would swallow the redirect.
  redirect(HOME_ROUTE);
}

/**
 * Mints a Firebase custom token for the session cookie's uid, so the browser
 * SDK can be signed back in from the server session.
 *
 * The two halves of auth drift apart: the cookie lasts SESSION_MAX_AGE, while
 * the client SDK's IndexedDB state can be cleared independently. When that
 * happens every client Firestore read starts failing `firestore.rules`
 * (`request.auth` is null) and `/login` refuses to help, because it redirects
 * away whenever the cookie is valid. This is the bridge back.
 *
 * The cookie is the authority here — `getCurrentUser()` has already verified
 * it, so the uid is never attacker-supplied. It returns null rather than
 * redirecting (unlike `requireUser()`, whose redirect throws NEXT_REDIRECT and
 * would be swallowed by the catch below).
 */
export async function createClientAuthToken(): Promise<
  { token: string } | SessionError
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Not signed in." };

    const token = await getAdminAuth().createCustomToken(user.uid);
    return { token };
  } catch (error) {
    console.error("[auth] createClientAuthToken failed", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not refresh client auth.",
    };
  }
}

export async function removeSession() {
  const cookie = await readSessionCookie();

  if (cookie) {
    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifySessionCookie(cookie);
      await adminAuth.revokeRefreshTokens(decoded.uid);
    } catch(error) {
      console.error(error);
    }
  }

  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);

  redirect(ROOT_ROUTE);
}
