import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/libs/firebase/admin";
import {
  REFRESHABLE_FIELDS,
  parseExtensionJob,
} from "@/libs/jobtracker/extensionPayload";
import {
  authenticateExtension,
  json,
  jobDocumentId,
  preflight,
} from "@/libs/jobtracker/extensionApi";

/**
 * Save endpoint for the browser extension.
 *
 * Authentication is a bearer token, not the session cookie — see
 * `libs/jobtracker/extensionToken.ts`. `proxy.ts` exempts this path from the
 * cookie redirect, or the request would never arrive.
 */

export async function OPTIONS(): Promise<Response> {
  return preflight();
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateExtension(request);
  if ("error" in auth) return auth.error;
  const { uid } = auth;

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

    const id = jobDocumentId(job.url);
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
