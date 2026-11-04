import {
  paragraphs,
  recipientLines,
  senderContact,
} from "@/components/coverletter/templates/shared";
import type { CoverLetterDocument } from "@/libs/coverletter/coverLetterSchema";
import { toTypstTheme, type TypstTheme } from "./theme";

/**
 * The JSON a letter template receives (`render(data)` in
 * public/typst/templates/letter/*.typ). Content rules (which lines print, in
 * what order) are applied here so templates are pure styling.
 */
export interface TypstCoverLetterDoc {
  theme: TypstTheme;
  sender: { name: string; title: string; contact: string[] };
  recipient: string[];
  date: string;
  subject: string;
  salutation: string;
  body: string[];
  closing: string;
  signature: string;
}

export function toTypstCoverLetter(
  document: CoverLetterDocument,
): TypstCoverLetterDoc {
  return {
    theme: toTypstTheme(document.theme),
    sender: {
      name: document.sender.name || "Your name",
      title: document.sender.title,
      contact: senderContact(document),
    },
    recipient: recipientLines(document.recipient),
    date: document.date,
    subject: document.subject,
    salutation: document.salutation,
    body: paragraphs(document),
    closing: document.closing,
    signature: document.signature,
  };
}
