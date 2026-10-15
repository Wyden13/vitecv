import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/constants";

/**
 * The raw session cookie, or null when absent. The value is a signed Firebase
 * session cookie — it is *not* trustworthy until `getAdminAuth().verifySessionCookie`
 * has checked it. Verification lives in `libs/dal.ts`.
 */
export async function readSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}
