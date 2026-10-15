"use server";

import { getCurrentUser } from "@/libs/dal";
import { callGlmJson } from "@/libs/insights/glm";
import {
  normalizeAnalysisPayload,
  normalizeGapPayload,
  type AnalysisPayload,
  type GapPayload,
} from "@/libs/insights/insightSchema";
import { analysisMessages, gapMessages } from "@/libs/insights/prompts";
import {
  countBullets,
  serializeBlocks,
  type TextBlock,
} from "@/libs/insights/resumeText";

/**
 * The only path to GLM. The key lives here, server-side, and the browser keeps
 * owning Firestore — the caller writes the result itself, which is how every
 * other resume write already works (`firestore.rules` is explicit about it).
 *
 * Two actions rather than one because they go stale on different things: the
 * analysis changes when the resume changes, the gap when the target role does.
 * Bundling them would re-bill the analysis on every edit of the role field.
 */

/** Roughly 5k tokens of resume — far more than a real CV, and a cost ceiling. */
const MAX_CHARS = 20_000;

/** Caps the payload at a block boundary, so no block is half-sent. */
function capBlocks(blocks: TextBlock[]): TextBlock[] {
  const kept: TextBlock[] = [];
  let total = 0;

  for (const block of blocks) {
    total += block.id.length + block.text.length + 4;
    if (total > MAX_CHARS) break;
    kept.push(block);
  }

  return kept;
}

async function requireSession(): Promise<void> {
  const user = await getCurrentUser();

  // Without this the action is an open proxy to this project's GLM credits.
  if (!user) throw new Error("Sign in to analyse a resume.");
}

function assertBlocks(blocks: TextBlock[]): void {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error("There is nothing in this resume to analyse yet.");
  }
}

export async function analyzeResume(
  blocks: TextBlock[],
): Promise<AnalysisPayload & { model: string }> {
  await requireSession();
  assertBlocks(blocks);

  const capped = capBlocks(blocks);
  const { data, model } = await callGlmJson(
    analysisMessages(serializeBlocks(capped)),
  );

  // The bullet total is passed in, not patched on afterwards: the normalizer
  // clamps `quantifiedCount` against it, so a count supplied after the fact
  // would arrive too late — it had already been clamped against zero.
  const payload = normalizeAnalysisPayload(
    data,
    capped.map((block) => block.id),
    countBullets(capped),
  );

  return { ...payload, model };
}

export async function analyzeRoleGap(
  blocks: TextBlock[],
  role: string,
): Promise<GapPayload & { model: string }> {
  await requireSession();
  assertBlocks(blocks);

  if (!role.trim()) throw new Error("Enter a job title or paste a description.");

  const capped = capBlocks(blocks);
  const { data, model } = await callGlmJson(
    gapMessages(serializeBlocks(capped), role.slice(0, 6_000)),
  );

  return { ...normalizeGapPayload(data), model };
}
