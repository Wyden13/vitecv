import { getAdminDb } from "@/libs/firebase/admin";
import {
  authenticateExtension,
  json,
  jobDocumentId,
  preflight,
} from "@/libs/jobtracker/extensionApi";

/**
 * Tells the extension whether a posting is already tracked, so its panel can
 * show "Saved · Applied · 82% match" instead of offering to save it again.
 * Bearer-token auth; `proxy.ts` exempts the path from the cookie redirect.
 */
export async function OPTIONS(): Promise<Response> {
  return preflight();
}

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateExtension(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url).searchParams.get("url") ?? "";
  const id = jobDocumentId(url);

  if (!id) return json({ error: "Missing url." }, 400);

  try {
    const snapshot = await getAdminDb()
      .collection("users")
      .doc(auth.uid)
      .collection("jobApplications")
      .doc(id)
      .get();

    if (!snapshot.exists) return json({ saved: false }, 200);

    const data = snapshot.data();

    return json(
      {
        saved: true,
        id,
        status: typeof data?.status === "string" ? data.status : "saved",
        matchScore:
          typeof data?.matchScore === "number" ? data.matchScore : null,
      },
      200,
    );
  } catch (error) {
    console.error("[api/jobs/lookup] read failed:", error);
    return json({ error: "Could not look up this job." }, 500);
  }
}
