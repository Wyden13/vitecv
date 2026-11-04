import type { CoverLetterTemplateId } from "@/libs/coverletter/coverLetterSchema";
import { DEFAULT_COVER_LETTER_TEMPLATE } from "@/libs/coverletter/coverLetterSchema";

/**
 * Each id is typeset by public/typst/templates/letter/<id>.typ (registered in
 * public/typst/main.typ and libs/typst/client.ts).
 */
export interface CoverLetterTemplate {
  id: CoverLetterTemplateId;
  name: string;
  description: string;
}

export const COVER_LETTER_TEMPLATES: Record<
  CoverLetterTemplateId,
  CoverLetterTemplate
> = {
  formal: {
    id: "formal",
    name: "Formal",
    description:
      "Traditional block letter with a sender header, date and recipient address.",
  },
  modernLetter: {
    id: "modernLetter",
    name: "Modern letter",
    description:
      "Tinted header band that matches the Modern resume, for a matching set.",
  },
};

export const COVER_LETTER_TEMPLATE_LIST: CoverLetterTemplate[] = Object.values(
  COVER_LETTER_TEMPLATES,
);

export function getCoverLetterTemplate(
  id: string | undefined,
): CoverLetterTemplate {
  return (
    COVER_LETTER_TEMPLATES[id as CoverLetterTemplateId] ??
    COVER_LETTER_TEMPLATES[DEFAULT_COVER_LETTER_TEMPLATE]
  );
}
