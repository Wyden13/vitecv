import { COVER_LETTER_TEMPLATE_LIST } from "../coverletter/templates/registry";
import { RESUME_TEMPLATE_LIST } from "../resume/templates/registry";

/**
 * Every template on offer, flattened across document types for the gallery.
 *
 * The per-type registries stay the source of truth — this only joins them so
 * one grid can list both and filter between them.
 */

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
