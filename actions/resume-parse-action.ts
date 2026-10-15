"use server";

import { getCurrentUser } from "@/libs/dal";
import { callGlmJson } from "@/libs/insights/glm";
import { structureMessages } from "@/libs/resume/parse/prompt";

/**
 * Structures an uploaded resume with GLM. The browser sends text that has
 * already had contact details swapped for tokens (`redactContacts`), and it
 * does its own verification afterwards, because only it holds the original
 * text the output has to be checked against.
 *
 * The result goes back unvalidated on purpose: `normalizeParsedResume` on the
 * client is the one place that decides what survives.
 */

/** Same ceiling as Insights. Lines past it land in "Other" via the coverage check. */
const MAX_CHARS = 20_000;

function capAtLine(text: string): string {
  if (text.length <= MAX_CHARS) return text;

  const cut = text.lastIndexOf("\n", MAX_CHARS);
  return text.slice(0, cut > 0 ? cut : MAX_CHARS);
}

export async function structureResumeText(
  redactedText: string,
): Promise<{ data: unknown; model: string }> {
  const user = await getCurrentUser();

  // Without this the action is an open proxy to this project's GLM credits.
  if (!user) throw new Error("Sign in to import a resume.");

  if (typeof redactedText !== "string" || !redactedText.trim()) {
    throw new Error("There is no text to import.");
  }

  return callGlmJson(structureMessages(capAtLine(redactedText)));
}
