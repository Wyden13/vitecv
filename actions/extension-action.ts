"use server";

import { requireUser } from "@/libs/dal";
import {
  issuePairingCode,
  readExtensionTokenInfo,
  revokeExtensionToken,
  type ExtensionTokenInfo,
} from "@/libs/jobtracker/extensionToken";

const PAIRING_CODE_TTL_MS = 10 * 60 * 1000;

/**
 * A code to type into the extension, valid for ten minutes (or until the
 * session expires, if sooner). Shown once, never stored in the clear.
 */
export async function createPairingCode(): Promise<{ code: string }> {
  const user = await requireUser();
  const expiresAt = Math.min(
    user.sessionExpiresAt,
    Date.now() + PAIRING_CODE_TTL_MS,
  );
  return issuePairingCode(user.uid, new Date(expiresAt));
}

/** Describes the active pairing without revealing the token. */
export async function getExtensionToken(): Promise<ExtensionTokenInfo | null> {
  const user = await requireUser();
  return readExtensionTokenInfo(user.uid);
}

export async function disconnectExtension(): Promise<void> {
  const user = await requireUser();
  await revokeExtensionToken(user.uid);
}
