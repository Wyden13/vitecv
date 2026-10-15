import type { CoverLetterDocument } from "@/libs/coverletter/coverLetterSchema";
import { paragraphs, recipientLines, senderContact } from "./shared";

export default function ModernLetter({
  document,
}: {
  document: CoverLetterDocument;
}) {
  const { sender, recipient } = document;
  const contact = senderContact(document);
  const toLines = recipientLines(recipient);
  const body = paragraphs(document);

  return (
    <div className="flex min-h-[11in] flex-col text-[10.5pt] leading-relaxed text-zinc-900">
      <header
        className="bg-[color:var(--tpl-accent-soft)] px-[0.7in] py-[0.5in]"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        <h1 className="text-[20pt] font-bold leading-tight [font-family:var(--tpl-heading)]">
          {sender.name || "Your name"}
        </h1>
        {sender.title && (
          <p className="mt-0.5 text-[11pt] text-[color:var(--tpl-accent)]">
            {sender.title}
          </p>
        )}
        {contact.length > 0 && (
          <p className="mt-2 text-[9pt] text-zinc-700">
            {contact.join("  ·  ")}
          </p>
        )}
      </header>

      <div className="flex-1 px-[0.7in] py-[0.5in]">
        <div className="flex items-start justify-between gap-8">
          {toLines.length > 0 ? (
            <address className="not-italic text-[9.5pt] leading-snug text-zinc-700">
              {toLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </address>
          ) : (
            <span />
          )}
          {document.date && (
            <p className="shrink-0 text-[9.5pt] text-zinc-500">
              {document.date}
            </p>
          )}
        </div>

        {document.subject && (
          <p className="mt-6 text-[12pt] font-semibold text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
            {document.subject}
          </p>
        )}

        {document.salutation && <p className="mt-4">{document.salutation}</p>}

        <div className="mt-3 space-y-3.5">
          {body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {(document.closing || document.signature) && (
          <div className="mt-7">
            {document.closing && (
              <p className="text-zinc-700">{document.closing}</p>
            )}
            {document.signature && (
              <p className="mt-5 text-[12pt] font-semibold text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
                {document.signature}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
