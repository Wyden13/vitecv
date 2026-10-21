import type { ChatAttachment } from "@/libs/chat/chatSchema";

import { FileTextIcon, XIcon } from "../icons";

export interface AttachmentChipsProps {
  attachments: (ChatAttachment & { id?: string })[];
  /** Omit for the read-only transcript variant. */
  onRemove?: (id: string) => void;
}

/**
 * Shows only the filename. The extracted body travels with the message to the
 * model but is deliberately never rendered — displaying it is exactly the
 * behaviour this replaced.
 */
export default function AttachmentChips({
  attachments,
  onRemove,
}: AttachmentChipsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {attachments.map((attachment, index) => (
        <span
          key={attachment.id ?? `${attachment.name}-${index}`}
          title={attachment.name}
          className="inline-flex max-w-56 items-center gap-1.5 rounded-md bg-accent-subtle px-2 py-1 text-xs text-accent"
        >
          <FileTextIcon className="size-3.5 shrink-0" />
          <span className="truncate">{attachment.name}</span>

          {onRemove && attachment.id && (
            <button
              type="button"
              onClick={() => onRemove(attachment.id as string)}
              aria-label={`Remove ${attachment.name}`}
              className="shrink-0 rounded p-0.5 transition-colors hover:bg-accent-subtle-hover"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
