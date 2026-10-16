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

export async function createSession(idToken: string) {
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
