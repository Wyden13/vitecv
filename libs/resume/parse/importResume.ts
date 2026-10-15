import { structureResumeText } from "@/actions/resume-parse-action";

import { redactContacts } from "./contacts";
import { heuristicStructure } from "./heuristic";
import { normalizeParsedResume, type ParsedResume } from "./structureSchema";

export interface ImportedResume extends ParsedResume {
  /** True when GLM was unavailable and the local heuristic did the work. */
  usedFallback: boolean;
}

/**
 * Extracted text → editor document. Contacts are redacted before GLM sees
 * anything; whichever structurer runs, its output is verified against the
 * original text by `normalizeParsedResume`.
 */
export async function importResumeText(source: string): Promise<ImportedResume> {
  const redacted = redactContacts(source);

  try {
    const { data } = await structureResumeText(redacted.text);
    const parsed = normalizeParsedResume(data, source, redacted);

    // A response with no section surviving verification is no better than the
    // heuristic, and usually much worse than it.
    const structured = parsed.document.sections.some((section) => section.heading !== "Other");
    if (structured) return { ...parsed, usedFallback: false };

    console.warn("[import] GLM output had no verifiable sections; using the local parser.");
  } catch (caught) {
    console.warn("[import] GLM structuring failed; using the local parser.", caught);
  }

  return {
    ...normalizeParsedResume(heuristicStructure(redacted.text), source, redacted),
    usedFallback: true,
  };
}
