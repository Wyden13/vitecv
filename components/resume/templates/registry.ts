import type { ComponentType, CSSProperties } from "react";

import type { ResumeDocument, ResumeTemplateId } from "@/libs/resume/resumeSchema";
import { DEFAULT_RESUME_TEMPLATE } from "@/libs/resume/resumeSchema";
import Classic from "./Classic";
import Modern from "./Modern";

export interface ResumeTemplate {
  id: ResumeTemplateId;
  name: string;
  description: string;
  component: ComponentType<{ document: ResumeDocument }>;
  pageStyle?: CSSProperties;
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
};

export const RESUME_TEMPLATE_LIST: ResumeTemplate[] =
  Object.values(RESUME_TEMPLATES);

export function getResumeTemplate(id: string | undefined): ResumeTemplate {
  return (
    RESUME_TEMPLATES[id as ResumeTemplateId] ??
    RESUME_TEMPLATES[DEFAULT_RESUME_TEMPLATE]
  );
}
