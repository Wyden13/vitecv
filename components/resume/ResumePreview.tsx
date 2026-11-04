"use client";

import type { ResumeDocument } from "@/libs/resume/resumeSchema";
import { toTypstResume } from "@/libs/typst/resumeDoc";
import TypstDocument from "../templates/TypstDocument";
import { getResumeTemplate } from "./templates/registry";

export interface ResumePreviewProps {
  document: ResumeDocument;
}

export default function ResumePreview({ document }: ResumePreviewProps) {
  return (
    <TypstDocument
      kind="resume"
      template={getResumeTemplate(document.templateId).id}
      doc={toTypstResume(document)}
    />
  );
}
