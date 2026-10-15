import type { ComponentType, CSSProperties } from "react";

import type {
  CoverLetterDocument,
  CoverLetterTemplateId,
} from "@/libs/coverletter/coverLetterSchema";
import { DEFAULT_COVER_LETTER_TEMPLATE } from "@/libs/coverletter/coverLetterSchema";
import Formal from "./Formal";
import ModernLetter from "./ModernLetter";

export interface CoverLetterTemplate {
  id: CoverLetterTemplateId;
  name: string;
  description: string;
  component: ComponentType<{ document: CoverLetterDocument }>;
  pageStyle?: CSSProperties;
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
    component: Formal,
  },
  modernLetter: {
    id: "modernLetter",
    name: "Modern letter",
    description:
      "Tinted header band that matches the Modern resume, for a matching set.",
    component: ModernLetter,
    pageStyle: { "--page-pad-x": "0in", "--page-pad-y": "0in" } as CSSProperties,
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
