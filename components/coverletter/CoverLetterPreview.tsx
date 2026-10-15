import type { CoverLetterDocument } from "@/libs/coverletter/coverLetterSchema";
import { themeStyle } from "@/libs/templateTheme";
import { getCoverLetterTemplate } from "./templates/registry";

export default function CoverLetterPreview({
  document,
}: {
  document: CoverLetterDocument;
}) {
  const template = getCoverLetterTemplate(document.templateId);
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
