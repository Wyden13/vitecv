import type { CoverLetterTemplateId } from "@/libs/coverletter/coverLetterSchema";
import type { ResumeTemplateId } from "@/libs/resume/resumeSchema";
import { SAMPLE_COVER_LETTER, SAMPLE_RESUME } from "@/data/sampleDocuments";
import type { DocumentTheme } from "@/libs/templateTheme";
import CoverLetterPreview from "../coverletter/CoverLetterPreview";
import ResumePreview from "../resume/ResumePreview";
import type { CatalogEntry } from "./catalog";

interface TemplatePreviewProps{
  entry: CatalogEntry,
  theme:DocumentTheme
}

export default function TemplatePreview({entry,theme}: TemplatePreviewProps) {
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
