import { timingSafeEqual } from "node:crypto";

/**
 * Temporary deployment diagnostic: reports which auth-related environment
 * variables a running deployment actually sees. Reports **booleans only** —
 * never a value, never a fragment of one.
 *
 * Exists because a misconfigured host (missing NEXT_PUBLIC_* vars, a mangled
 * FIREBASE_PRIVATE_KEY) and a correctly configured one are indistinguishable
 * from the browser: sign-in just fails. Delete this route, and DIAG_TOKEN,
 * once login is confirmed working.
 *
 * `proxy.ts` must exempt this path, or the cookie gate redirects it to /login.
 */

export const dynamic = "force-dynamic";

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function privateKeyParses(): boolean {
  const raw = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!raw) return false;

  const first = raw[0];
  const unquoted =
    (first === '"' || first === "'") && raw.at(-1) === first
      ? raw.slice(1, -1)
      : raw;

  return unquoted.replace(/\\n/g, "\n").startsWith("-----BEGIN");
}

export async function GET(request: Request): Promise<Response> {
  const expected = process.env.DIAG_TOKEN;
  const provided = request.headers.get("x-diag-token");

  // Unset token or wrong token look identical from outside: a 404, as if the
  // route did not exist.
  if (!expected || !provided || !tokenMatches(provided, expected)) {
    return new Response("Not Found", { status: 404 });
  }

  return Response.json({
    client: {
      apiKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      authDomain: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
      projectId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      storageBucket: Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
      messagingSenderId: Boolean(
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      ),
      appId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
      measurementId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
    },
    admin: {
      projectId: Boolean(process.env.FIREBASE_PROJECT_ID),
      clientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      privateKeySet: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      privateKeyParses: privateKeyParses(),
    },
  });
}
