import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/libs/firebase/firebase";
import {
  normalizeAnalysisPayload,
  normalizeGapPayload,
  normalizeJobMatchPayload,
  type AnalysisPayload,
  type GapPayload,
  type JobMatchPayload,
  type ResumeAnalysis,
  type RoleGap,
} from "./insightSchema";

/**
 * Stored analyses, read and written from the browser like every other resume
 * document. `firestore.rules` already covers the path through its
 * `users/{uid}/{document=**}` rule, so there is nothing to add there.
 *
 * These live in a subcollection rather than as fields on the resume: the resume
 * document already carries `rawText`, and the editor re-reads it on every
 * keystroke-driven snapshot. Analyses have no business inflating that.
 *
 * Stored payloads go back through the same normalizers the model output does —
 * a document written by an older build is as untrusted as a model reply, and
 * re-filtering citations against the *current* blocks means the evidence panel
 * can never point at text the user has since deleted.
 */

function insightDoc(userId: string, resumeId: string, name: "latest" | "gap") {
  return doc(db, "users", userId, "resumes", resumeId, "insights", name);
}

/**
 * Job matches are many-per-resume, one per posting, so they get a subcollection
 * rather than the fixed `insights/{latest,gap}` ids — whose `name` union is
 * closed for exactly that reason.
 *
 * `key` is a hash of the inputs AND the document id, which makes a cache lookup
 * one `getDoc` with no query and no index.
 */
function jobMatchDoc(userId: string, resumeId: string, key: string) {
  return doc(db, "users", userId, "resumes", resumeId, "jobMatches", key);
}

function toDate(value: unknown): Date | null {
  // Pending server timestamps read back as null on the local echo.
  return (value as Timestamp | null | undefined)?.toDate() ?? null;
}

/**
 * `getKnownBlockIds` is a getter, not an array, because the resume can change
 * while this subscription is open: it must be read when a snapshot arrives, not
 * when we subscribed, or citations would be filtered against a stale resume.
 */
export function subscribeToAnalysis(
  userId: string,
  resumeId: string,
  getKnownBlockIds: () => Iterable<string>,
  handlers: {
    onData: (analysis: ResumeAnalysis | null) => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    insightDoc(userId, resumeId, "latest"),
    (snapshot) => {
      if (!snapshot.exists()) {
        handlers.onData(null);
        return;
      }

      const data = snapshot.data();
      const payload = normalizeAnalysisPayload(data, getKnownBlockIds());

      handlers.onData({
        ...payload,
        model: typeof data.model === "string" ? data.model : "",
        sourceHash: typeof data.sourceHash === "string" ? data.sourceHash : "",
        createdAt: toDate(data.createdAt),
      });
    },
    (error) => handlers.onError(error),
  );
}

export async function saveAnalysis(
  userId: string,
  resumeId: string,
  analysis: AnalysisPayload & { model: string; sourceHash: string },
): Promise<void> {
  await setDoc(insightDoc(userId, resumeId, "latest"), {
    ...analysis,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToRoleGap(
  userId: string,
  resumeId: string,
  handlers: {
    onData: (gap: RoleGap | null) => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    insightDoc(userId, resumeId, "gap"),
    (snapshot) => {
      if (!snapshot.exists()) {
        handlers.onData(null);
        return;
      }

      const data = snapshot.data();

      handlers.onData({
        ...normalizeGapPayload(data),
        role: typeof data.role === "string" ? data.role : "",
        model: typeof data.model === "string" ? data.model : "",
        sourceHash: typeof data.sourceHash === "string" ? data.sourceHash : "",
        createdAt: toDate(data.createdAt),
      });
    },
    (error) => handlers.onError(error),
  );
}

export async function saveRoleGap(
  userId: string,
  resumeId: string,
  gap: GapPayload & { role: string; model: string; sourceHash: string },
): Promise<void> {
  await setDoc(insightDoc(userId, resumeId, "gap"), {
    ...gap,
    createdAt: serverTimestamp(),
  });
}

export interface StoredJobMatch extends JobMatchPayload {
  model: string;
  sourceHash: string;
  createdAt: Date | null;
}

/**
 * The cache read. One-shot rather than a subscription: this is consulted at the
 * moment a match runs, not watched for changes.
 *
 * Returns null on a miss, which is the caller's signal to call the model.
 *
 * `key` comes from `hashText`, a 32-bit FNV-1a, so a collision is possible in
 * principle — around 1e-6 odds at a hundred stored matches for one user, and
 * the cost is a stale-but-valid earlier result. Fine for a cache.
 */
export async function readJobMatch(
  userId: string,
  resumeId: string,
  key: string,
): Promise<StoredJobMatch | null> {
  const snapshot = await getDoc(jobMatchDoc(userId, resumeId, key));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  return {
    ...normalizeJobMatchPayload(data),
    model: typeof data.model === "string" ? data.model : "",
    sourceHash: typeof data.sourceHash === "string" ? data.sourceHash : "",
    createdAt: toDate(data.createdAt),
  };
}

export async function saveJobMatch(
  userId: string,
  resumeId: string,
  key: string,
  match: JobMatchPayload & { model: string },
): Promise<void> {
  await setDoc(jobMatchDoc(userId, resumeId, key), {
    ...match,
    sourceHash: key,
    createdAt: serverTimestamp(),
  });
}
