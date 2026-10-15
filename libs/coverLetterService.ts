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
  createEmptyCoverLetterDocument,
  normalizeCoverLetterDocument,
  type CoverLetterDocument,
  type CoverLetterTemplateId,
} from "@/libs/coverLetterSchema";

/**
 * Cover letter storage, deliberately shaped like `resumeService`.
 *
 * `users/{uid}/coverLetters` sits under the same `users/{uid}/{document=**}`
 * rule the resumes do, so no firestore.rules change is needed.
 */

export interface CoverLetterRecord {
  id: string;
  title: string;
  document: CoverLetterDocument;
  updatedAt: Date | null;
}

export interface CoverLetterSummary {
  id: string;
  title: string;
  updatedAt: Date | null;
}

function lettersCollection(userId: string) {
  return collection(db, "users", userId, "coverLetters");
}

function letterDoc(userId: string, letterId: string) {
  return doc(db, "users", userId, "coverLetters", letterId);
}

export async function createCoverLetter(
  userId: string,
  options: { title?: string; templateId?: CoverLetterTemplateId } = {},
): Promise<string> {
  const document = createEmptyCoverLetterDocument();
  if (options.templateId) document.templateId = options.templateId;

  const created = await addDoc(lettersCollection(userId), {
    title: options.title?.trim() || "Untitled cover letter",
    document,
    createdAt: serverTimestamp(),
    // Required, not incidental: the list query orders by this and silently
    // excludes documents that lack it.
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

export function subscribeToCoverLetter(
  userId: string,
  letterId: string,
  handlers: {
    onData: (letter: CoverLetterRecord) => void;
    onMissing: () => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    letterDoc(userId, letterId),
    (snapshot) => {
      if (!snapshot.exists()) {
        handlers.onMissing();
        return;
      }

      const data = snapshot.data();
      const updatedAt = data.updatedAt as Timestamp | null | undefined;

      handlers.onData({
        id: snapshot.id,
        title: data.title ?? "Untitled cover letter",
        document: normalizeCoverLetterDocument(data.document),
        updatedAt: updatedAt?.toDate() ?? null,
      });
    },
    (error) => handlers.onError(error),
  );
}

export function subscribeToCoverLetters(
  userId: string,
  handlers: {
    onData: (letters: CoverLetterSummary[]) => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    query(lettersCollection(userId), orderBy("updatedAt", "desc")),
    (snapshot) => {
      handlers.onData(
        snapshot.docs.map((entry) => {
          // An unresolved serverTimestamp reads back as null by default, so a
          // just-created row would render dateless and sort to one end.
          const data = entry.data({ serverTimestamps: "estimate" });
          const updatedAt = data.updatedAt as Timestamp | null | undefined;

          return {
            id: entry.id,
            title: data.title ?? "Untitled cover letter",
            updatedAt: updatedAt?.toDate() ?? null,
          };
        }),
      );
    },
    (error) => handlers.onError(error),
  );
}

export async function deleteCoverLetter(
  userId: string,
  letterId: string,
): Promise<void> {
  await deleteDoc(letterDoc(userId, letterId));
}

export async function updateCoverLetter(
  userId: string,
  letterId: string,
  patch: { title?: string; document?: CoverLetterDocument },
): Promise<void> {
  await updateDoc(letterDoc(userId, letterId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
