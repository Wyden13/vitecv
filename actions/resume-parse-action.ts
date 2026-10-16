"use server";

import { getCurrentUser } from "@/libs/dal";
import { callGlmJson } from "@/libs/insights/glm";
import { structureMessages } from "@/libs/resume/parse/prompt";

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

  if (!user) throw new Error("Sign in to import a resume.");

  if (typeof redactedText !== "string" || !redactedText.trim()) {
    throw new Error("There is no text to import.");
  }

  return callGlmJson(structureMessages(capAtLine(redactedText)));
}
