import { COVER_LETTER_TEMPLATE_LIST } from "../coverletter/templates/registry";
import { RESUME_TEMPLATE_LIST } from "../resume/templates/registry";

export type TemplateKind = "resume" | "coverLetter";

export interface CatalogEntry {
  kind: TemplateKind;
  id: string;
  name: string;
  description: string;
}

export const KIND_LABELS: Record<TemplateKind, string> = {
  resume: "Resume",
  coverLetter: "Cover letter",
};

export const TEMPLATE_CATALOG: CatalogEntry[] = [
  ...RESUME_TEMPLATE_LIST.map((template) => ({
    kind: "resume" as const,
    id: template.id,
    name: template.name,
    description: template.description,
  })),
  ...COVER_LETTER_TEMPLATE_LIST.map((template) => ({
    kind: "coverLetter" as const,
    id: template.id,
    name: template.name,
    description: template.description,
  })),
];
