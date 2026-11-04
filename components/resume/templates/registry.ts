import type { ResumeTemplateId } from "@/libs/resume/resumeSchema";
import { DEFAULT_RESUME_TEMPLATE } from "@/libs/resume/resumeSchema";
import type { DocumentTheme } from "@/libs/templateTheme";

/**
 * Each id is typeset by public/typst/templates/resume/<id>.typ (registered in
 * public/typst/main.typ and libs/typst/client.ts).
 */
export interface ResumeTemplate {
  id: ResumeTemplateId;
  name: string;
  description: string;
  defaultTheme?: DocumentTheme;
}

export const RESUME_TEMPLATES: Record<ResumeTemplateId, ResumeTemplate> = {
  classic: {
    id: "classic",
    name: "Classic",
    description:
      "Single column, no graphics. The safest choice for applicant tracking systems.",
  },
  modern: {
    id: "modern",
    name: "Modern",
    description:
      "Tinted sidebar for contact details and skills, with experience alongside.",
  },
  harvard: {
    id: "harvard",
    name: "Harvard",
    description:
      "Centred headings and serif type, printed in black. The Harvard career-services format.",
    defaultTheme: {
      accent: "black",
      fontPair: "times",
      headingSize: 14,
      bodySize: 11,
    },
  },
};

export const RESUME_TEMPLATE_LIST: ResumeTemplate[] =
  Object.values(RESUME_TEMPLATES);

export function getResumeTemplate(id: string | undefined): ResumeTemplate {
  return (
    RESUME_TEMPLATES[id as ResumeTemplateId] ??
    RESUME_TEMPLATES[DEFAULT_RESUME_TEMPLATE]
  );
}
