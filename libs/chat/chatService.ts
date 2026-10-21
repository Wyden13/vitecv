import "server-only";

import { FieldValue, type Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/libs/firebase/admin";
import {
  normalizeAttachments,
  type ChatAttachment,
  type ChatMessageRecord,
  type ChatRole,
} from "./chatSchema";

/**
 * One rolling thread per user at `users/{uid}/chat/current`, with the turns in
 * its `messages` subcollection. There is deliberately no thread list: starting
 * a new chat replaces this one.
 *
 * Read and written with the admin SDK so the transcript can be server-rendered
 * — the rest of the app uses the browser SDK and `onSnapshot`. Because the
 * admin SDK ignores `firestore.rules`, `uid` here must always come from
 * `requireUser()`.
 */

/** Keeps a long conversation from blowing past the model's context. */
const MAX_HISTORY = 40;

function messagesCollection(uid: string) {
  return getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("chat")
    .doc("current")
    .collection("messages");
}

function toDate(value: unknown): Date | null {
  return (value as Timestamp | null | undefined)?.toDate() ?? null;
}

function asRole(value: unknown): ChatRole {
  return value === "assistant" ? "assistant" : "user";
}

export async function readThread(uid: string): Promise<ChatMessageRecord[]> {
  const snapshot = await messagesCollection(uid)
    .orderBy("createdAt", "asc")
    .limit(MAX_HISTORY)
    .get();

  return snapshot.docs.map((entry) => {
    const data = entry.data();

    return {
      id: entry.id,
      role: asRole(data.role),
      content: typeof data.content === "string" ? data.content : "",
      attachments: normalizeAttachments(data.attachments),
      suggestLabel:
        typeof data.suggestLabel === "string" ? data.suggestLabel : "",
      suggestHref: typeof data.suggestHref === "string" ? data.suggestHref : "",
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function appendMessage(
  uid: string,
  message: {
    role: ChatRole;
    content: string;
    attachments?: ChatAttachment[];
    suggestLabel?: string;
    suggestHref?: string;
  },
): Promise<void> {
  await messagesCollection(uid).add({
    role: message.role,
    content: message.content,
    attachments: message.attachments ?? [],
    suggestLabel: message.suggestLabel ?? "",
    suggestHref: message.suggestHref ?? "",
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Wipes the thread — used by both "new chat" and the Clear button. */
export async function resetThread(uid: string): Promise<void> {
  const snapshot = await messagesCollection(uid).get();
  if (snapshot.empty) return;

  const batch = getAdminDb().batch();
  snapshot.docs.forEach((entry) => batch.delete(entry.ref));
  await batch.commit();
}
