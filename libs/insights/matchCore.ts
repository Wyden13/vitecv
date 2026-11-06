import { callGlmJson } from "@/libs/insights/glm";
import {
  normalizeJobMatchPayload,
  type JobMatchPayload,
} from "@/libs/insights/insightSchema";
import { jobMatchMessages } from "@/libs/insights/prompts";
import { serializeBlocks, type TextBlock } from "@/libs/insights/resumeText";

/**
 * The model call behind a job match, with no notion of who is asking.
 *
 * Callers own authentication: the `matchJob` server action checks the session
 * cookie, `/api/jobs/analyze` checks the extension's bearer token. Keeping the
 * caps here means both paths send the model exactly the same thing.
 */
export const MAX_RESUME_CHARS = 20_000;
export const MAX_JD_CHARS = 12_000;

export function capBlocks(blocks: TextBlock[]): TextBlock[] {
  const kept: TextBlock[] = [];
  let total = 0;

  for (const block of blocks) {
    total += block.id.length + block.text.length + 4;
    if (total > MAX_RESUME_CHARS) break;
    kept.push(block);
  }

  return kept;
}

export async function runJobMatch(
  blocks: TextBlock[],
  description: string,
): Promise<JobMatchPayload & { model: string }> {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error("There is nothing in this resume to analyse yet.");
  }

  if (!description.trim()) throw new Error("Paste a job description first.");

  const capped = capBlocks(blocks);
  const { data, model } = await callGlmJson(
    jobMatchMessages(
      serializeBlocks(capped),
      description.slice(0, MAX_JD_CHARS),
    ),
  );

  return { ...normalizeJobMatchPayload(data), model };
}
