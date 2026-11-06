import "server-only";

import type { DocumentData } from "firebase-admin/firestore";

import { getAdminDb } from "@/libs/firebase/admin";
import { normalizeResumeDocument } from "@/libs/resume/resumeSchema";
import type { ResumeRecord, ResumeStatus } from "@/libs/resume/resumeService";

/**
 * Admin-SDK twin of `getResume` in `resumeService.ts`, for routes that
 * authenticate with the extension's bearer token and so have no browser
 * Firebase session. The admin SDK bypasses `firestore.rules`, so the path is
 * built from the token's uid and nothing the caller sent.
 */
function toResumeRecord(id: string, data: DocumentData): ResumeRecord {
  return {
    id,
    title: data.title ?? "Untitled resume",
    fileName: data.fileName ?? null,
    rawText: data.rawText ?? "",
    status: (data.status as ResumeStatus) ?? "extracted",
    document: normalizeResumeDocument(data.document),
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  };
}

function resumes(uid: string) {
  return getAdminDb().collection("users").doc(uid).collection("resumes");
}

/** The requested resume, or the most recently edited one when none is named. */
export async function readResumeForUser(
  uid: string,
  resumeId?: string,
): Promise<ResumeRecord | null> {
  if (resumeId) {
    const snapshot = await resumes(uid).doc(resumeId).get();
    return snapshot.exists
      ? toResumeRecord(snapshot.id, snapshot.data() ?? {})
      : null;
  }

  const latest = await resumes(uid)
    .orderBy("updatedAt", "desc")
    .limit(1)
    .get();

  const doc = latest.docs[0];
  return doc ? toResumeRecord(doc.id, doc.data()) : null;
}
