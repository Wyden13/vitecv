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
  normalizeJobApplication,
  type JobApplication,
  type JobApplicationInput,
} from "./jobTrackerSchema";

/**
 * Tracked applications live at `users/{uid}/jobApplications`, read and written
 * straight from the browser like every other document in this app. The
 * recursive `users/{uid}/{document=**}` rule in `firestore.rules` already
 * covers the path, so there is nothing to add there.
 */

function jobApplicationsCollection(userId: string) {
  return collection(db, "users", userId, "jobApplications");
}

function jobApplicationDoc(userId: string, applicationId: string) {
  return doc(db, "users", userId, "jobApplications", applicationId);
}

function toDate(value: unknown): Date | null {
  return (value as Timestamp | null | undefined)?.toDate() ?? null;
}

export async function createJobApplication(
  userId: string,
  input: JobApplicationInput,
): Promise<string> {
  const created = await addDoc(jobApplicationsCollection(userId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

export function subscribeToJobApplications(
  userId: string,
  handlers: {
    onData: (applications: JobApplication[]) => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    query(jobApplicationsCollection(userId), orderBy("updatedAt", "desc")),
    (snapshot) => {
      handlers.onData(
        snapshot.docs.map((entry) => {
          const data = entry.data({ serverTimestamps: "estimate" });

          return normalizeJobApplication(
            entry.id,
            data,
            toDate(data.updatedAt),
          );
        }),
      );
    },
    (error) => handlers.onError(error),
  );
}

export async function updateJobApplication(
  userId: string,
  applicationId: string,
  patch: Partial<JobApplicationInput>,
): Promise<void> {
  await updateDoc(jobApplicationDoc(userId, applicationId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteJobApplication(
  userId: string,
  applicationId: string,
): Promise<void> {
  await deleteDoc(jobApplicationDoc(userId, applicationId));
}
