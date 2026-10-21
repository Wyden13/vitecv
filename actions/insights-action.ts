"use server";

import { getCurrentUser } from "@/libs/dal";
import { callGlmJson } from "@/libs/insights/glm";
import {
  normalizeAnalysisPayload,
  normalizeGapPayload,
  normalizeJobMatchPayload,
  type AnalysisPayload,
  type GapPayload,
  type JobMatchPayload,
} from "@/libs/insights/insightSchema";
import {
  analysisMessages,
  gapMessages,
  jobMatchMessages,
} from "@/libs/insights/prompts";
import {
  countBullets,
  serializeBlocks,
  type TextBlock,
} from "@/libs/insights/resumeText";

const MAX_CHARS = 20_000;
const MAX_JD_CHARS = 12_000;

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
  assertBlocks(blocks);

  if (!description.trim()) throw new Error("Paste a job description first.");

  const capped = capBlocks(blocks);
  const { data, model } = await callGlmJson(
    jobMatchMessages(serializeBlocks(capped), description.slice(0, MAX_JD_CHARS)),
  );
  return { ...normalizeJobMatchPayload(data), model };
}
