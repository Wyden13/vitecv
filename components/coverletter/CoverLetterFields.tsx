"use client";

import { useEffect, useRef, useState } from "react";

import {
  bodyToText,
  textToBody,
  type CoverLetterDocument,
} from "@/libs/coverletter/coverLetterSchema";
import SectionCard from "../resume/SectionCard";
import { Field, TextAreaField } from "../resume/fields/Field";

/**
 * The letter's form, in the order the page reads.
 *
 * Reuses the resume editor's `SectionCard` and `Field` primitives. The cards
 * are not reorderable — a business letter's parts have a fixed order — so the
 * drag props are stubbed out rather than wired to anything.
 */

const STATIC_DRAG = {
  canMoveUp: false,
  canMoveDown: false,
  onDragStart: () => {},
  onDragOver: () => {},
  onDrop: () => {},
  onDragEnd: () => {},
  isDragging: false,
  isDropTarget: false,
};

/**
 * The body textarea, holding its own text.
 *
 * It cannot be driven straight from `document.body`: `textToBody` drops empty
 * paragraphs, so the blank line you type to start one would be erased on the
 * very next render and a new paragraph could never be written. Local text is
 * the editable truth; the array is derived from it.
 */
function BodyField({
  body,
  onChange,
}: {
  body: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = useState(() => bodyToText(body));
  // Identity of the array we last pushed up. A different one means the change
  // came from elsewhere — a snapshot, a reset — and should replace our text.
  const pushed = useRef(body);

  useEffect(() => {
    if (body !== pushed.current) {
      pushed.current = body;
      setText(bodyToText(body));
    }
  }, [body]);

  return (
    <TextAreaField
      label="Body"
      rows={14}
      value={text}
      onChange={(next) => {
        setText(next);
        const parsed = textToBody(next);
        pushed.current = parsed;
        onChange(parsed);
      }}
      placeholder="I am writing to apply for…"
    />
  );
}

export interface CoverLetterFieldsProps {
  document: CoverLetterDocument;
  onChange: (next: CoverLetterDocument) => void;
}

export default function CoverLetterFields({
  document,
  onChange,
}: CoverLetterFieldsProps) {
  const { sender, recipient } = document;

  return (
    <div>
      <SectionCard
        heading="Your details"
        hint="Appears in the letter's header."
        {...STATIC_DRAG}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Full name"
            value={sender.name}
            onChange={(name) =>
              onChange({ ...document, sender: { ...sender, name } })
            }
            placeholder="Avery Lin"
          />
          <Field
            label="Headline"
            value={sender.title}
            onChange={(title) =>
              onChange({ ...document, sender: { ...sender, title } })
            }
            placeholder="Senior Frontend Engineer"
          />
          <Field
            label="Email"
            type="email"
            value={sender.email}
            onChange={(email) =>
              onChange({ ...document, sender: { ...sender, email } })
            }
          />
          <Field
            label="Phone"
            type="tel"
            value={sender.phone}
            onChange={(phone) =>
              onChange({ ...document, sender: { ...sender, phone } })
            }
          />
          <Field
            label="Location"
            value={sender.location}
            onChange={(location) =>
              onChange({ ...document, sender: { ...sender, location } })
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        heading="Recipient"
        hint="Who the letter is addressed to. Leave blank to omit the block."
        {...STATIC_DRAG}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Name"
            value={recipient.name}
            onChange={(name) =>
              onChange({ ...document, recipient: { ...recipient, name } })
            }
            placeholder="Dana Okonjo"
          />
          <Field
            label="Title"
            value={recipient.title}
            onChange={(title) =>
              onChange({ ...document, recipient: { ...recipient, title } })
            }
            placeholder="Engineering Manager"
          />
          <Field
            label="Company"
            value={recipient.company}
            onChange={(company) =>
              onChange({ ...document, recipient: { ...recipient, company } })
            }
          />
        </div>
        <div className="mt-3">
          <TextAreaField
            label="Address"
            rows={2}
            value={recipient.address}
            onChange={(address) =>
              onChange({ ...document, recipient: { ...recipient, address } })
            }
            placeholder={"480 Bryant Street\nSan Francisco, CA 94107"}
          />
        </div>
      </SectionCard>

      <SectionCard
        heading="Letter"
        hint="Separate paragraphs with a blank line."
        {...STATIC_DRAG}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Date"
            value={document.date}
            onChange={(date) => onChange({ ...document, date })}
            placeholder="14 October 2026"
          />
          <Field
            label="Subject"
            value={document.subject}
            onChange={(subject) => onChange({ ...document, subject })}
            placeholder="Application for Senior Frontend Engineer"
          />
        </div>

        <div className="mt-3 grid gap-3">
          <Field
            label="Salutation"
            value={document.salutation}
            onChange={(salutation) => onChange({ ...document, salutation })}
            placeholder="Dear Hiring Manager,"
          />
          {/*
            Stored as an array, edited as one textarea: splitting on change
            keeps the templates free of any parsing.
          */}
          <BodyField
            body={document.body}
            onChange={(body) => onChange({ ...document, body })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Closing"
              value={document.closing}
              onChange={(closing) => onChange({ ...document, closing })}
              placeholder="Sincerely,"
            />
            <Field
              label="Signature"
              value={document.signature}
              onChange={(signature) => onChange({ ...document, signature })}
              placeholder="Avery Lin"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
