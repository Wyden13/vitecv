"use client";

import { useEffect, useId, useRef } from "react";

import { XIcon } from "./icons";

/**
 * A right-anchored drawer. Sits at `z-40`, below the `z-50` toast stack, so a
 * save confirmation is still readable over an open panel.
 */
export interface SheetProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  /** Action row pinned under the scroll area — usually Cancel plus Save. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function Sheet({
  open,
  title,
  description,
  onClose,
  footer,
  children,
}: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const close = useRef(onClose);
  const headingId = useId();
  const descriptionId = useId();

  // Read through a ref so an inline `onClose` cannot retrigger the effect below
  // on every render, which would fight the user for focus.
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    opener.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const restoreOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = restoreOverflow;
      opener.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end print:hidden">
      <div
        role="presentation"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/40 dark:bg-zinc-950/70"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-background shadow-xl outline-none dark:border-zinc-800"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <h2
              id={headingId}
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
