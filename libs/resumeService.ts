import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/libs/firebase/firebase";
import {
  createEmptyResumeDocument,
  normalizeResumeDocument,
  type ResumeDocument,
  type ResumeTemplateId,
} from "@/libs/resumeSchema";

export type ResumeStatus = "extracted" | "editing";

/** A resume as the editor sees it, with Firestore plumbing resolved. */
export interface ResumeRecord {
  id: string;
  title: string;
  fileName: string | null;
  rawText: string;
  status: ResumeStatus;
  document: ResumeDocument;
  updatedAt: Date | null;
}

function resumesCollection(userId: string) {
  return collection(db, "users", userId, "resumes");
}

function resumeDoc(userId: string, resumeId: string) {
  return doc(db, "users", userId, "resumes", resumeId);
}

/** "Jane Doe Resume.pdf" -> "Jane Doe Resume" */
function titleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").trim();
  return withoutExtension || "Untitled resume";
}

export async function createResume(
  userId: string,
  { fileName, rawText }: { fileName: string; rawText: string },
): Promise<string> {
  const created = await addDoc(resumesCollection(userId), {
    title: titleFromFileName(fileName),
    fileName,
    rawText,
    status: "extracted" satisfies ResumeStatus,
    document: createEmptyResumeDocument(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

/**
 * Starts a resume from nothing, optionally in a chosen template.
 *
 * Both timestamps are written for the same reason `createResume` writes
 * them: `subscribeToResumes` orders by `updatedAt`, and that query drops
 * documents missing the field rather than erroring, so one would silently
 * never appear in the list.
 */
export async function createBlankResume(
  userId: string,
  options: { title?: string; templateId?: ResumeTemplateId } = {},
): Promise<string> {
  const document = createEmptyResumeDocument();
  if (options.templateId) document.templateId = options.templateId;

  const created = await addDoc(resumesCollection(userId), {
    title: options.title?.trim() || "Untitled resume",
    fileName: null,
    rawText: "",
    status: "editing" satisfies ResumeStatus,
    document,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

/**
 * Live subscription to one resume. `onMissing` fires when the document does
 * not exist, which the editor turns into a not-found state.
 */
export function subscribeToResume(
  userId: string,
  resumeId: string,
  handlers: {
    onData: (resume: ResumeRecord) => void;
    onMissing: () => void;
    onError: (error: Error) => void;
  },
) {
  return onSnapshot(
    resumeDoc(userId, resumeId),
    (snapshot) => {
      if (!snapshot.exists()) {
        handlers.onMissing();
        return;
      }

      const data = snapshot.data();
      const updatedAt = data.updatedAt as Timestamp | null | undefined;

      handlers.onData({
        id: snapshot.id,
        title: data.title ?? "Untitled resume",
        fileName: data.fileName ?? null,
        rawText: data.rawText ?? "",
        status: (data.status as ResumeStatus) ?? "extracted",
        document: normalizeResumeDocument(data.document),
        // Pending server timestamps arrive as null on the local echo.
        updatedAt: updatedAt?.toDate() ?? null,
      });
    },
    (error) => handlers.onError(error),
  );
}

/** What the resume list needs — no rawText, no parsed document. */
export interface ResumeSummary {
  id: string;
  title: string;
  fileName: string | null;
  status: ResumeStatus;
  updatedAt: Date | null;
}

/**
 * Live subscription to every resume the user owns, newest edit first.
 *
 * Note that `orderBy` *excludes* documents missing the field rather than
 * erroring — a resume without `updatedAt` would silently never appear here.
 * Every `createResume` writes one, so keep it that way.
 */
export function subscribeToResumes(
  userId: string,
  handlers: {
    onData: (resumes: ResumeSummary[]) => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    query(resumesCollection(userId), orderBy("updatedAt", "desc")),
    (snapshot) => {
      handlers.onData(
        snapshot.docs.map((entry) => {
          // A write that has not round-tripped yet has an unresolved
          // serverTimestamp, which reads back as null by default — the new row
          // would render dateless and sort to one end. The estimate avoids that.
          const data = entry.data({ serverTimestamps: "estimate" });
          const updatedAt = data.updatedAt as Timestamp | null | undefined;

          return {
            id: entry.id,
            title: data.title ?? "Untitled resume",
            fileName: data.fileName ?? null,
            status: (data.status as ResumeStatus) ?? "extracted",
            updatedAt: updatedAt?.toDate() ?? null,
          };
        }),
      );
    },
    (error) => handlers.onError(error),
  );
}

export async function deleteResume(
  userId: string,
  resumeId: string,
): Promise<void> {
  await deleteDoc(resumeDoc(userId, resumeId));
}

export async function updateResume(
  userId: string,
  resumeId: string,
  patch: { title?: string; document?: ResumeDocument; status?: ResumeStatus },
): Promise<void> {
  await updateDoc(resumeDoc(userId, resumeId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
