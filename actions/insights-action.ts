"use server";

import { getCurrentUser } from "@/libs/dal";
import { callGlmJson } from "@/libs/insights/glm";
import { capBlocks, runJobMatch } from "@/libs/insights/matchCore";
import {
  normalizeAnalysisPayload,
  normalizeGapPayload,
  type AnalysisPayload,
  type GapPayload,
  type JobMatchPayload,
} from "@/libs/insights/insightSchema";
import { analysisMessages, gapMessages } from "@/libs/insights/prompts";
import {
  countBullets,
  serializeBlocks,
  type TextBlock,
} from "@/libs/insights/resumeText";

async function requireSession(): Promise<void> {
  const user = await getCurrentUser();
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

export async function matchJob(
  blocks: TextBlock[],
  description: string,
): Promise<JobMatchPayload & { model: string }> {
  await requireSession();
  return runJobMatch(blocks, description);
}
