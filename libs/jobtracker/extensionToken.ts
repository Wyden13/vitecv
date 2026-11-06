import "server-only";

import { createHash, randomBytes, randomInt } from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

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

const CODES_COLLECTION = "extensionPairingCodes";
/** No I, O, 0 or 1 — a code read off a screen and typed by hand. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function hashCode(code: string): string {
  return createHash("sha256").update(normalizeCode(code)).digest("hex");
}

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
  lastUsedAt: string | null;
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
  const data = (await pointerDoc(uid).get()).data();

  if (!data || typeof data.prefix !== "string") return null;

  const used =
    typeof data.tokenHash === "string"
      ? await getAdminDb()
          .collection(TOKENS_COLLECTION)
          .doc(data.tokenHash)
          .get()
      : null;

  return {
    prefix: data.prefix,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    lastUsedAt: used?.data()?.lastUsedAt?.toDate?.()?.toISOString() ?? null,
  };
}

/** Deletes every outstanding pairing code for a user. */
export async function revokePairingCodes(uid: string): Promise<void> {
  const stale = await getAdminDb()
    .collection(CODES_COLLECTION)
    .where("uid", "==", uid)
    .get();

  await Promise.all(stale.docs.map((doc) => doc.ref.delete()));
}

/**
 * Issues a single-use code the user types into the extension. It lasts until
 * `expiresAt` (the session's own expiry) or until the user signs out, and a
 * new code replaces any earlier one.
 */
export async function issuePairingCode(
  uid: string,
  expiresAt: Date,
): Promise<{ code: string }> {
  await revokePairingCodes(uid);

  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }

  await getAdminDb()
    .collection(CODES_COLLECTION)
    .doc(hashCode(code))
    .set({
      uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

  return { code: `${code.slice(0, 4)}-${code.slice(4)}` };
}

/**
 * Trades a code for a fresh token, or returns null when it is unknown,
 * expired or already used. Read and delete share one transaction so two
 * simultaneous redemptions cannot both succeed.
 */
export async function redeemPairingCode(code: string): Promise<string | null> {
  if (normalizeCode(code).length !== CODE_LENGTH) return null;

  const db = getAdminDb();
  const ref = db.collection(CODES_COLLECTION).doc(hashCode(code));

  const uid = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return null;

    // Burn it even when expired, so a stale doc does not linger.
    tx.delete(ref);

    const data = snapshot.data();
    const live =
      data?.expiresAt instanceof Timestamp &&
      data.expiresAt.toMillis() > Date.now();

    return live && typeof data?.uid === "string" ? data.uid : null;
  });

  return uid ? issueExtensionToken(uid) : null;
}

/** Revokes the active token, which signs the extension out at once. */
export async function revokeExtensionToken(uid: string): Promise<void> {
  const pointer = pointerDoc(uid);
  const hash = (await pointer.get()).data()?.tokenHash;

  if (typeof hash === "string") {
    await getAdminDb().collection(TOKENS_COLLECTION).doc(hash).delete();
  }
  await pointer.delete();
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
