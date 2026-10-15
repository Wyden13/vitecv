import type {
  CoverLetterDocument,
  LetterRecipient,
} from "@/libs/coverletter/coverLetterSchema";

/** Content rules both letter templates share. */

export function senderContact(document: CoverLetterDocument): string[] {
  const { sender } = document;
  return [sender.email, sender.phone, sender.location].filter(Boolean);
}

/** Recipient block lines, in the order a business letter expects them. */
export function recipientLines(recipient: LetterRecipient): string[] {
  return [
    recipient.name,
    recipient.title,
    recipient.company,
    ...recipient.address.split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean);
}

export function paragraphs(document: CoverLetterDocument): string[] {
  return document.body.filter((paragraph) => paragraph.trim());
}
