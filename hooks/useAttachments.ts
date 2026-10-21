"use client";

import { useCallback, useState, type ChangeEvent } from "react";

import { useToast } from "@/components/Toast";
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_CHARS,
  type ChatAttachment,
} from "@/libs/chat/chatSchema";
import { extractFileText } from "@/libs/extractFile";
import { createId } from "@/libs/resume/resumeSchema";
import { validateUpload } from "@/libs/uploadFile";

export interface PendingAttachment extends ChatAttachment {
  id: string;
}

export interface Attachments {
  attachments: PendingAttachment[];
  reading: boolean;
  add: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  remove: (id: string) => void;
  clear: () => void;
  chars: number;
}

/**
 * Pick → validate → extract → chip, shared by both composers.
 *
 * Extraction has to happen here rather than on the server: `extractFileText`
 * uses `DOMParser` and a pdf.js worker, both browser-only. The text then
 * travels to the server as a form value.
 *
 * Every rejection says why. A file that silently fails to appear reads as a
 * broken button.
 */
export function useAttachments(): Attachments {
  const { notify } = useToast();

  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [reading, setReading] = useState(false);

  const chars = attachments.reduce(
    (total, entry) => total + entry.text.length,
    0,
  );

  const add = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      // Reset first so re-picking the same file still fires a change.
      event.target.value = "";
      if (selected.length === 0) return;

      setReading(true);
      try {
        for (const file of selected) {
          const invalid = validateUpload(file);
          if (invalid) {
            notify({ variant: "error", message: `${file.name}: ${invalid}` });
            continue;
          }

          let rejected = "";

          setAttachments((current) => {
            if (current.length >= MAX_ATTACHMENTS) {
              rejected = `You can attach at most ${MAX_ATTACHMENTS} files.`;
              return current;
            }
            if (current.some((entry) => entry.name === file.name)) {
              rejected = `${file.name} is already attached.`;
              return current;
            }
            return current;
          });

          if (rejected) {
            notify({ variant: "error", message: rejected });
            continue;
          }

          const extracted = await extractFileText(file).catch(
            (caught: unknown) => {
              notify({
                variant: "error",
                message: `${file.name}: ${
                  caught instanceof Error
                    ? caught.message
                    : "could not be read."
                }`,
              });
              return "";
            },
          );

          if (!extracted.trim()) {
            if (extracted === "") continue;
            notify({
              variant: "error",
              message: `${file.name}: no readable text found.`,
            });
            continue;
          }

          let tooBig = false;

          setAttachments((current) => {
            const used = current.reduce(
              (total, entry) => total + entry.text.length,
              0,
            );

            if (used + extracted.length > MAX_ATTACHMENT_CHARS) {
              tooBig = true;
              return current;
            }

            return [
              ...current,
              { id: createId(), name: file.name, text: extracted },
            ];
          });

          if (tooBig) {
            notify({
              variant: "error",
              message: `${file.name} would exceed the ${MAX_ATTACHMENT_CHARS.toLocaleString()} character limit for one message.`,
            });
          }
        }
      } finally {
        setReading(false);
      }
    },
    [notify],
  );

  const remove = useCallback((id: string) => {
    setAttachments((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const clear = useCallback(() => setAttachments([]), []);

  return { attachments, reading, add, remove, clear, chars };
}
