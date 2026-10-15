import {
  DEFAULT_THEME,
  normalizeTheme,
  type DocumentTheme,
} from "./templateTheme";

/** Mirrors resumeSchema.ts: a plain shape, a factory, and a normalizer. */

export type CoverLetterTemplateId = "formal" | "modernLetter";

export const COVER_LETTER_TEMPLATE_IDS: CoverLetterTemplateId[] = [
  "formal",
  "modernLetter",
];

export const DEFAULT_COVER_LETTER_TEMPLATE: CoverLetterTemplateId = "formal";

export interface LetterSender {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

export interface LetterRecipient {
  name: string;
  title: string;
  company: string;
  address: string;
}

export interface CoverLetterDocument {
  sender: LetterSender;
  recipient: LetterRecipient;
  date: string;
  subject: string;
  salutation: string;
  /** One string per paragraph; the editor splits a textarea on blank lines. */
  body: string[];
  closing: string;
  signature: string;
  templateId: CoverLetterTemplateId;
  theme: DocumentTheme;
}

export function createEmptyCoverLetterDocument(): CoverLetterDocument {
  return {
    sender: { name: "", title: "", email: "", phone: "", location: "" },
    recipient: { name: "", title: "", company: "", address: "" },
    date: "",
    subject: "",
    salutation: "Dear Hiring Manager,",
    body: [],
    closing: "Sincerely,",
    signature: "",
    templateId: DEFAULT_COVER_LETTER_TEMPLATE,
    theme: { ...DEFAULT_THEME },
  };
}

export function normalizeCoverLetterDocument(
  value: Partial<CoverLetterDocument> | undefined | null,
): CoverLetterDocument {
  const base = createEmptyCoverLetterDocument();
  if (!value) return base;

  return {
    sender: { ...base.sender, ...value.sender },
    recipient: { ...base.recipient, ...value.recipient },
    date: value.date ?? base.date,
    subject: value.subject ?? base.subject,
    salutation: value.salutation ?? base.salutation,
    body: Array.isArray(value.body) ? value.body : base.body,
    closing: value.closing ?? base.closing,
    signature: value.signature ?? base.signature,
    templateId:
      value.templateId && COVER_LETTER_TEMPLATE_IDS.includes(value.templateId)
        ? value.templateId
        : DEFAULT_COVER_LETTER_TEMPLATE,
    theme: normalizeTheme(value.theme),
  };
}

/** Textarea round-trip: blank lines separate paragraphs. */
export function bodyToText(body: string[]): string {
  return body.join("\n\n");
}

export function textToBody(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
