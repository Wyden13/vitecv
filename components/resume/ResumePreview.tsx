import type { ResumeDocument } from "@/libs/resume/resumeSchema";
import { themeStyle } from "@/libs/templateTheme";
import { getResumeTemplate } from "./templates/registry";

export interface ResumePreviewProps {
  document: ResumeDocument;
}

export default function ResumePreview({ document }: ResumePreviewProps) {
  const template = getResumeTemplate(document.templateId);
  const Template = template.component;

  return (
    <div
      className="doc-page doc-surface overflow-hidden bg-white text-zinc-900 shadow-lg [font-family:var(--tpl-body)]"
      style={{ ...themeStyle(document.theme), ...template.pageStyle }}
    >
      <Template document={document} />
    </div>
  );
}
