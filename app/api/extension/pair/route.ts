import { redeemPairingCode } from "@/libs/jobtracker/extensionToken";

/**
 * Pairing endpoint for the browser extension: trades a one-time code for a
 * bearer token. The code itself is the credential, so there is no
 * Authorization header. `proxy.ts` exempts this path from the cookie redirect.
 *
 * Same CORS reasoning as app/api/jobs: no cookie, so no ambient authority for
 * another origin to borrow.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const code =
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    typeof body.code === "string"
      ? body.code
      : "";

  if (!code) return json({ error: "Missing connection code." }, 400);

  try {
    const token = await redeemPairingCode(code);

    if (!token) {
      return json(
        { error: "That code is invalid or expired. Get a new one." },
        401,
      );
    }

    return json({ token }, 200);
  } catch (error) {
    console.error("[api/extension/pair] redeem failed:", error);
    return json({ error: "Could not connect the extension." }, 500);
  }
}
