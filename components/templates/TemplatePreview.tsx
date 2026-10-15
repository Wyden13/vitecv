import type { CoverLetterTemplateId } from "@/libs/coverLetterSchema";
import type { ResumeTemplateId } from "@/libs/resumeSchema";
import { SAMPLE_COVER_LETTER, SAMPLE_RESUME } from "@/libs/sampleDocuments";
import type { DocumentTheme } from "@/libs/templateTheme";
import CoverLetterPreview from "../coverletter/CoverLetterPreview";
import ResumePreview from "../resume/ResumePreview";
import type { CatalogEntry } from "./catalog";

/** Renders a catalog entry filled with sample content, at full page size. */
export default function TemplatePreview({
  entry,
  theme,
}: {
  entry: CatalogEntry;
  theme: DocumentTheme;
}) {
  if (entry.kind === "resume") {
    return (
      <ResumePreview
        document={{
          ...SAMPLE_RESUME,
          templateId: entry.id as ResumeTemplateId,
          theme,
        }}
      />
    );
  }

  return (
    <CoverLetterPreview
      document={{
        ...SAMPLE_COVER_LETTER,
        templateId: entry.id as CoverLetterTemplateId,
        theme,
      }}
    />
  );
}
