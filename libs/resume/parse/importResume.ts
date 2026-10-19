import { structureResumeText } from "@/actions/resume-parse-action";
import { redactContacts } from "./contacts";
import { heuristicStructure } from "./heuristic";
import { normalizeParsedResume, type ParsedResume } from "./structureSchema";

export interface ImportedResume extends ParsedResume {
  usedFallback: boolean;
}

/**
 * Extracted text to editor document
 */
export async function importResumeText(source: string): Promise<ImportedResume> {
  const redacted = redactContacts(source);

  try {
    const { data } = await structureResumeText(redacted.text);
    const parsed = normalizeParsedResume(data, source, redacted);
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
