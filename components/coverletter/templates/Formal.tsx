import type { CoverLetterDocument } from "@/libs/coverletter/coverLetterSchema";
import { paragraphs, recipientLines, senderContact } from "./shared";

export default function Formal({
  document,
}: {
  document: CoverLetterDocument;
}) {
  const { sender, recipient } = document;
  const contact = senderContact(document);
  const toLines = recipientLines(recipient);
  const body = paragraphs(document);

  return (
    <div className="text-[length:calc(var(--tpl-body-size)_+_1pt)] leading-relaxed text-zinc-900">
      <header className="border-b-2 border-[color:var(--tpl-accent)] pb-3">
        <h1 className="text-[length:calc(var(--tpl-heading-size)_+_3pt)] font-bold leading-tight [font-family:var(--tpl-heading)]">
          {sender.name || "Your name"}
        </h1>
        {sender.title && (
          <p className="text-[length:calc(var(--tpl-body-size)_+_0.5pt)] text-zinc-700">{sender.title}</p>
        )}
        {contact.length > 0 && (
          <p className="mt-1 text-[length:calc(var(--tpl-body-size)_-_0.5pt)] text-zinc-700">
            {contact.join("  ·  ")}
          </p>
        )}
      </header>

      {document.date && (
        <p className="mt-6 text-[length:calc(var(--tpl-body-size)_+_0.5pt)] text-zinc-700">{document.date}</p>
      )}

      {toLines.length > 0 && (
        <address className="mt-5 not-italic text-[length:calc(var(--tpl-body-size)_+_0.5pt)] leading-snug text-zinc-800">
          {toLines.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </address>
      )}

      {document.subject && (
        <p className="mt-5 font-semibold [font-family:var(--tpl-heading)]">
          {document.subject}
        </p>
      )}

      {document.salutation && <p className="mt-5">{document.salutation}</p>}

      <div className="mt-4 space-y-3.5">
        {body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {(document.closing || document.signature) && (
        <div className="mt-6">
          {document.closing && <p>{document.closing}</p>}
          {document.signature && (
            <p className="mt-6 font-semibold [font-family:var(--tpl-heading)]">
              {document.signature}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
