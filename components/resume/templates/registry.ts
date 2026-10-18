import type { ComponentType, CSSProperties } from "react";

import type { ResumeDocument, ResumeTemplateId } from "@/libs/resume/resumeSchema";
import { DEFAULT_RESUME_TEMPLATE } from "@/libs/resume/resumeSchema";
import type { DocumentTheme } from "@/libs/templateTheme";
import Classic from "./Classic";
import Harvard from "./Harvard";
import Modern from "./Modern";

export interface ResumeTemplate {
  id: ResumeTemplateId;
  name: string;
  description: string;
  component: ComponentType<{ document: ResumeDocument }>;
  pageStyle?: CSSProperties;
  defaultTheme?: DocumentTheme;
}

export const RESUME_TEMPLATES: Record<ResumeTemplateId, ResumeTemplate> = {
  classic: {
    id: "classic",
    name: "Classic",
    description:
      "Single column, no graphics. The safest choice for applicant tracking systems.",
    component: Classic,
  },
  modern: {
    id: "modern",
    name: "Modern",
    description:
      "Tinted sidebar for contact details and skills, with experience alongside.",
    component: Modern,
    pageStyle: { "--page-pad-x": "0in", "--page-pad-y": "0in" } as CSSProperties,
  },
  harvard: {
    id: "harvard",
    name: "Harvard",
    description:
      "Centred headings and serif type, printed in black. The Harvard career-services format.",
    component: Harvard,
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
