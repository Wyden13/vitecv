"use server";

import { requireUser } from "@/libs/dal";
import {
  issuePairingCode,
  readExtensionTokenInfo,
  revokeExtensionToken,
  type ExtensionTokenInfo,
} from "@/libs/jobtracker/extensionToken";

/**
 * A code to type into the extension, valid until sign-out or the session
 * expires. Shown once, never stored in the clear.
 */
export async function createPairingCode(): Promise<{ code: string }> {
  const user = await requireUser();
  return issuePairingCode(user.uid, new Date(user.sessionExpiresAt));
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
