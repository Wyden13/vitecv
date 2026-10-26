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
