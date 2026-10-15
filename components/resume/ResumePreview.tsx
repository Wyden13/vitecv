import type { ResumeDocument } from "@/libs/resume/resumeSchema";
import { themeStyle } from "@/libs/templateTheme";
import { getResumeTemplate } from "./templates/registry";

/**
 * Renders a resume in whichever template it has selected.
 *
 * This is the only place that knows a document maps to a component. It owns
 * the paper itself — size, padding, white background — and publishes the
 * theme as CSS variables; templates lay out content inside that and read the
 * variables for colour and type.
 */

export interface ResumePreviewProps {
  document: ResumeDocument;
}

export default function ResumePreview({ document }: ResumePreviewProps) {
  const template = getResumeTemplate(document.templateId);
  const Template = template.component;

  return (
    <div
      className="doc-page overflow-hidden bg-white text-zinc-900 shadow-lg [font-family:var(--tpl-body)]"
      style={{ ...themeStyle(document.theme), ...template.pageStyle }}
    >
      <Template document={document} />
    </div>
  );
}
