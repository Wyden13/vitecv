import { timingSafeEqual } from "node:crypto";
/**
 * Temporary deployment diagnostic: reports which auth-related environment
 * variables the *running* deployment actually sees.
 *
 * Exists because from a browser a host missing NEXT_PUBLIC_FIREBASE_* and one
 * with a mangled FIREBASE_PRIVATE_KEY are indistinguishable — sign-in just
 * fails. Reports booleans and remediation messages only; never an env var's
 * value, nor any fragment of one.
 *
 * `proxy.ts` must exempt this path, or the session gate redirects it to
 * /login — exactly in the unauthenticated case where it is needed.
 *
 * Delete this route, `describeAdminCredentials`, and DIAG_TOKEN once login
 * is confirmed working.
 *
 * No `export const dynamic` here: it is rejected by `cacheComponents` in
 * next.config.ts, and reading `request.headers` already forces this handler
 * to be dynamic.
 */

/**
 * Mirrors normalizePrivateKey() in libs/firebase/admin.ts. Duplicated rather
 * than imported to keep this throwaway diagnostic from adding exports to the
 * real auth module; keep the two in step while this route exists.
 */
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

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  const expected = process.env.DIAG_TOKEN;
  const provided = request.headers.get("x-diag-token");

  // An unset DIAG_TOKEN and a wrong token look identical from outside: a 404,
  // as if the route did not exist.
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
