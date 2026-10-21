import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/libs/firebase/admin";

/**
 * Bearer tokens that let the browser extension save jobs.
 *
 * The extension cannot use the session cookie: it is `SameSite=Lax`, and a
 * cross-site POST from a `safari-web-extension://` origin never carries it.
 *
 * Only the SHA-256 of a token is stored, the way an API key would be — a
 * leaked database row cannot be replayed as a credential. Lookup lives in a
 * **top-level** collection keyed by that hash so resolving a token is a
 * single `get()` by document id, with no index and no collection-group query.
 *
 * `extensionTokens` is deliberately outside `users/{uid}/{document=**}` in
 * `firestore.rules`, so it is denied to every client by default while the
 * admin SDK bypasses rules. Do not add a rule for it.
 */

const TOKENS_COLLECTION = "extensionTokens";
const TOKEN_LABEL = "vcv_";

/** Enough of the token to recognise it in the UI, never enough to use it. */
const PREFIX_LENGTH = TOKEN_LABEL.length + 8;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Pointer to the active token, so regenerating can revoke the old hash. */
function pointerDoc(uid: string) {
  return getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("extension")
    .doc("current");
}

export interface ExtensionTokenInfo {
  prefix: string;
  createdAt: string | null;
}

/**
 * Issues a token, revoking any previous one, and returns it in the clear.
 * This is the only moment the raw value exists — it is never stored, so it
 * cannot be shown again.
 */
export async function issueExtensionToken(uid: string): Promise<string> {
  const token = TOKEN_LABEL + randomBytes(32).toString("base64url");
  const hash = hashToken(token);
  const prefix = token.slice(0, PREFIX_LENGTH);

  const db = getAdminDb();
  const pointer = pointerDoc(uid);
  const previous = await pointer.get();
  const previousHash = previous.data()?.tokenHash;

  if (typeof previousHash === "string" && previousHash !== hash) {
    await db.collection(TOKENS_COLLECTION).doc(previousHash).delete();
  }

  await db.collection(TOKENS_COLLECTION).doc(hash).set({
    uid,
    prefix,
    createdAt: FieldValue.serverTimestamp(),
    lastUsedAt: null,
  });

  await pointer.set({
    tokenHash: hash,
    prefix,
    createdAt: FieldValue.serverTimestamp(),
  });

  return token;
}

export async function readExtensionTokenInfo(
  uid: string,
): Promise<ExtensionTokenInfo | null> {
  const snapshot = await pointerDoc(uid).get();
  const data = snapshot.data();

  if (!data || typeof data.prefix !== "string") return null;

  return {
    prefix: data.prefix,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
  };
}

/** Resolves a token to its owner's uid, or null when unknown or revoked. */
export async function resolveExtensionToken(
  token: string,
): Promise<string | null> {
  if (!token) return null;

  const ref = getAdminDb().collection(TOKENS_COLLECTION).doc(hashToken(token));
  const snapshot = await ref.get();
  const uid = snapshot.data()?.uid;

  if (typeof uid !== "string" || !uid) return null;

  // Useful for spotting a stale pairing; not worth delaying the response for.
  void ref
    .update({ lastUsedAt: FieldValue.serverTimestamp() })
    .catch(() => undefined);

  return uid;
}
