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

function insightDoc(userId: string, resumeId: string, name: "latest" | "gap") {
  return doc(db, "users", userId, "resumes", resumeId, "insights", name);
}

function jobMatchDoc(userId: string, resumeId: string, key: string) {
  return doc(db, "users", userId, "resumes", resumeId, "jobMatches", key);
}

function toDate(value: unknown): Date | null {
  return (value as Timestamp | null | undefined)?.toDate() ?? null;
}

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
 * The cache read.
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
