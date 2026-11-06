import "server-only";

import { createHash } from "node:crypto";

import { canonicalJobUrl } from "@/libs/jobtracker/extensionPayload";
import { resolveExtensionToken } from "@/libs/jobtracker/extensionToken";

/**
 * Plumbing shared by the extension's bearer-token routes (`/api/jobs`,
 * `/api/jobs/lookup`, `/api/jobs/analyze`).
 *
 * `*` is safe for CORS only because the credential is a header rather than a
 * cookie: there is no ambient authority for another origin to borrow. Adding
 * `Allow-Credentials` would be both pointless and incompatible with `*`.
 */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function bearerToken(header: string | null): string {
  const match = /^Bearer\s+(.+)$/i.exec(header?.trim() ?? "");
  return match ? match[1].trim() : "";
}

/** The uid behind the request's token, or the error response to return. */
export async function authenticateExtension(
  request: Request,
): Promise<{ uid: string } | { error: Response }> {
  const token = bearerToken(request.headers.get("authorization"));

  if (!token) {
    return {
      error: json(
        { error: "Missing Authorization: Bearer <token> header." },
        401,
      ),
    };
  }

  try {
    const uid = await resolveExtensionToken(token);

    if (!uid) {
      return {
        error: json(
          { error: "Unknown or revoked extension token. Generate a new one." },
          401,
        ),
      };
    }

    return { uid };
  } catch (error) {
    console.error("[api/extension] token lookup failed:", error);
    return {
      error: json({ error: "Could not verify the extension token." }, 500),
    };
  }
}

/**
 * Document id derived from the posting URL so re-saving the same job updates
 * it. Without a URL there is nothing to dedupe on.
 */
export function jobDocumentId(url: string): string | null {
  if (!url) return null;

  return createHash("sha256")
    .update(canonicalJobUrl(url))
    .digest("hex")
    .slice(0, 24);
}
