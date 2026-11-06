import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/libs/firebase/admin";
import {
  authenticateExtension,
  json,
  jobDocumentId,
  preflight,
} from "@/libs/jobtracker/extensionApi";
import { runJobMatch } from "@/libs/insights/matchCore";
import {
  groupByTier,
  hashText,
  matchScore,
  normalizeJobMatchPayload,
  type JobMatchPayload,
} from "@/libs/insights/insightSchema";
import { blocksFromResume, serializeBlocks } from "@/libs/insights/resumeText";
import { rateLimit } from "@/libs/rateLimit";
import { readResumeForUser } from "@/libs/resume/resumeAdmin";

/**
 * Scores a posting against one of the user's resumes for the extension panel.
 *
 * Same model call and cache as the web app's Job Match page (`runJobMatch`,
 * `users/{uid}/resumes/{id}/jobMatches/{key}`), so a score computed here is a
 * cache hit there and the other way round.
 */
export async function OPTIONS(): Promise<Response> {
  return preflight();
}

const HOUR_MS = 60 * 60 * 1000;
const MAX_ANALYSES_PER_HOUR = 30;

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateExtension(request);
  if ("error" in auth) return auth.error;
  const { uid } = auth;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const input = (typeof body === "object" && body !== null ? body : {}) as {
    description?: unknown;
    resumeId?: unknown;
    url?: unknown;
  };

  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const resumeId =
    typeof input.resumeId === "string" && input.resumeId
      ? input.resumeId
      : undefined;
  const url = typeof input.url === "string" ? input.url : "";

  if (!description) {
    return json({ error: "This job has no description to analyse." }, 400);
  }

  try {
    const resume = await readResumeForUser(uid, resumeId);

    if (!resume) {
      return json(
        { error: "Add a resume in viteCV first.", code: "no-resume" },
        404,
      );
    }

    const blocks = blocksFromResume(resume);

    if (blocks.length === 0) {
      return json(
        { error: "That resume is empty.", code: "no-resume" },
        404,
      );
    }

    const key = hashText(`${serializeBlocks(blocks)}\u0000${description}`);
    const db = getAdminDb();
    const cacheRef = db
      .collection("users")
      .doc(uid)
      .collection("resumes")
      .doc(resume.id)
      .collection("jobMatches")
      .doc(key);

    const cached = await cacheRef.get();
    let match: JobMatchPayload;

    if (cached.exists) {
      match = normalizeJobMatchPayload(cached.data());
    } else {
      // Only a model call costs quota, so cache hits skip the limiter.
      const limit = rateLimit(`analyze:${uid}`, MAX_ANALYSES_PER_HOUR, HOUR_MS);

      if (!limit.ok) {
        return json(
          {
            error: `Too many analyses. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.`,
          },
          429,
        );
      }

      const fresh = await runJobMatch(blocks, description);
      match = fresh;
      await cacheRef
        .set({ ...fresh, sourceHash: key, createdAt: FieldValue.serverTimestamp() })
        .catch(() => undefined);
    }

    const score = matchScore(match.items);

    // Record the score on the tracked job, if it is tracked.
    const jobId = jobDocumentId(url);
    if (jobId) {
      const jobRef = db
        .collection("users")
        .doc(uid)
        .collection("jobApplications")
        .doc(jobId);

      await jobRef
        .update({ matchScore: score.score, updatedAt: FieldValue.serverTimestamp() })
        .catch(() => undefined); // not tracked yet: nothing to update
    }

    return json(
      {
        resume: { id: resume.id, title: resume.title },
        score,
        // Only what the resume lacks: the panel is small and a gap list is the
        // actionable part. The full breakdown lives on the Job Match page.
        missing: groupByTier(match.items.filter((item) => !item.present)).map(
          (group) => ({
            title: group.tier.title,
            terms: group.items.map((item) => item.term),
          }),
        ),
        cached: cached.exists,
      },
      200,
    );
  } catch (error) {
    console.error("[api/jobs/analyze] failed:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not analyse this job.",
      },
      500,
    );
  }
}
