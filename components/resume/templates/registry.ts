import type { ComponentType, CSSProperties } from "react";

import type { ResumeDocument, ResumeTemplateId } from "@/libs/resumeSchema";
import { DEFAULT_RESUME_TEMPLATE } from "@/libs/resumeSchema";
import Classic from "./Classic";
import Modern from "./Modern";

/**
 * Every resume look, keyed by the id stored on the document.
 *
 * Imports are static on purpose: the gallery renders all of these at once and
 * printing cannot wait on a chunk to arrive, so there is nothing to gain from
 * lazy loading and a blank page to lose.
 */

export interface ResumeTemplate {
  id: ResumeTemplateId;
  name: string;
  description: string;
  component: ComponentType<{ document: ResumeDocument }>;
  /**
   * Overrides for the page itself — `--page-pad-x` / `--page-pad-y`. A
   * full-bleed template zeroes these and insets its own columns instead. It
   * has to be declared here rather than inside the template: the padding sits
   * on `.doc-page`, which is the dispatcher's element, and a custom property
   * set by a child never reaches its parent.
   */
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

/** Falls back rather than throwing, so a bad stored id still renders a page. */
export function getResumeTemplate(id: string | undefined): ResumeTemplate {
  return (
    RESUME_TEMPLATES[id as ResumeTemplateId] ??
    RESUME_TEMPLATES[DEFAULT_RESUME_TEMPLATE]
  );
}
