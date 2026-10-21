"use server";

import { requireUser } from "@/libs/dal";
import {
  issueExtensionToken,
  readExtensionTokenInfo,
  type ExtensionTokenInfo,
} from "@/libs/jobtracker/extensionToken";

/**
 * Issues a pairing token for the browser extension. The raw token is returned
 * exactly once — only its hash is stored — so the caller has to show it
 * immediately or the user has to regenerate.
 */
export async function createExtensionToken(): Promise<{
  token: string;
  info: ExtensionTokenInfo | null;
}> {
  const user = await requireUser();
  const token = await issueExtensionToken(user.uid);

  return { token, info: await readExtensionTokenInfo(user.uid) };
}

/** Describes the active token without revealing it. */
export async function getExtensionToken(): Promise<ExtensionTokenInfo | null> {
  const user = await requireUser();
  return readExtensionTokenInfo(user.uid);
}
