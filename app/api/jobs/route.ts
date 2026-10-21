import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/libs/firebase/admin";
import {
  REFRESHABLE_FIELDS,
  canonicalJobUrl,
  parseExtensionJob,
} from "@/libs/jobtracker/extensionPayload";
import { resolveExtensionToken } from "@/libs/jobtracker/extensionToken";

/**
 * Save endpoint for the browser extension.
 *
 * Authentication is a bearer token, not the session cookie — see
 * `libs/jobtracker/extensionToken.ts`. `proxy.ts` exempts this path from the
 * cookie redirect, or the request would never arrive.
 */

/**
 * `*` is safe here only because the credential is a header rather than a
 * cookie: there is no ambient authority for another origin to borrow. Adding
 * `Allow-Credentials` would be both pointless and incompatible with `*`.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

function bearerToken(header: string | null): string {
  const match = /^Bearer\s+(.+)$/i.exec(header?.trim() ?? "");
  return match ? match[1].trim() : "";
}

/**
 * Document id derived from the posting URL so re-saving the same job updates
 * it. Without a URL there is nothing to dedupe on, so the caller gets a fresh
 * auto-id instead.
 */
function documentId(url: string): string | null {
  if (!url) return null;

  return createHash("sha256")
    .update(canonicalJobUrl(url))
    .digest("hex")
    .slice(0, 24);
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  const token = bearerToken(request.headers.get("authorization"));

  if (!token) {
    return json(
      { error: "Missing Authorization: Bearer <token> header." },
      401,
    );
  }

  let uid: string | null;

  try {
    uid = await resolveExtensionToken(token);
  } catch (error) {
    console.error("[api/jobs] token lookup failed:", error);
    return json({ error: "Could not verify the extension token." }, 500);
  }

  if (!uid) {
    return json(
      { error: "Unknown or revoked extension token. Generate a new one." },
      401,
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const parsed = parseExtensionJob(payload);

  if (!parsed.ok) {
    return json({ error: parsed.error }, 400);
  }

  const job = parsed.value;

  try {
    // The path comes from the token's uid, never from the body: the admin SDK
    // bypasses firestore.rules, so this is the only thing scoping the write.
    const collection = getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("jobApplications");

    const id = documentId(job.url);
    const ref = id ? collection.doc(id) : collection.doc();
    const existing = await ref.get();

    if (existing.exists) {
      // Refresh what the posting says and leave the tracker's own state
      // alone, so re-clipping a job already moved to Interview does not
      // reset its status, applied date, next action or match score.
      const facts = Object.fromEntries(
        REFRESHABLE_FIELDS.map((field) => [field, job[field]]),
      );

      await ref.update({ ...facts, updatedAt: FieldValue.serverTimestamp() });
    } else {
      await ref.set({
        ...job,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return json(
      { id: ref.id, created: !existing.exists },
      existing.exists ? 200 : 201,
    );
  } catch (error) {
    console.error("[api/jobs] save failed:", error);
    return json({ error: "Could not save this job." }, 500);
  }
}
