"use client";

import type { CoverLetterDocument } from "@/libs/coverletter/coverLetterSchema";
import { toTypstCoverLetter } from "@/libs/typst/coverLetterDoc";
import TypstDocument from "../templates/TypstDocument";
import { getCoverLetterTemplate } from "./templates/registry";

export default function CoverLetterPreview({
  document,
}: {
  document: CoverLetterDocument;
}) {
  return (
    <TypstDocument
      kind="letter"
      template={getCoverLetterTemplate(document.templateId).id}
      doc={toTypstCoverLetter(document)}
    />
  );
}
