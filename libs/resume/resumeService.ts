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
} from "@/libs/resume/resumeSchema";
import { normalizeTheme, type DocumentTheme } from "@/libs/templateTheme";

export type ResumeStatus = "extracted" | "editing";

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

function titleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").trim();
  return withoutExtension || "Untitled resume";
}

export async function createResume(
  userId: string,
  {
    fileName,
    rawText,
    document,
  }: { fileName: string; rawText: string; document?: ResumeDocument },
): Promise<string> {
  const created = await addDoc(resumesCollection(userId), {
    title: titleFromFileName(fileName),
    fileName,
    rawText,
    // A structured import is ready to edit; a bare upload still needs structuring.
    status: (document ? "editing" : "extracted") satisfies ResumeStatus,
    document: document ?? createEmptyResumeDocument(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

export async function createBlankResume(
  userId: string,
  options: {
    title?: string;
    templateId?: ResumeTemplateId;
    /** Starting theme, for templates drawn around a particular typeface. */
    theme?: DocumentTheme;
  } = {},
): Promise<string> {
  const document = createEmptyResumeDocument();
  if (options.templateId) document.templateId = options.templateId;
  if (options.theme) document.theme = normalizeTheme(options.theme);

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
        updatedAt: updatedAt?.toDate() ?? null,
      });
    },
    (error) => handlers.onError(error),
  );
}

export interface ResumeSummary {
  id: string;
  title: string;
  fileName: string | null;
  status: ResumeStatus;
  updatedAt: Date | null;
}

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
