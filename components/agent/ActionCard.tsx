"use client";

import Button from "../Button";
import { CheckIcon, SpinnerIcon, XIcon } from "../icons";

/**
 * The runtime approval gate: a proposed change, with Apply withheld until a
 * person clicks it.
 *
 * Two display modes, because the two surfaces hold different information.
 * Insights owns the document, so it shows a real before/after. Chat does not,
 * and fetching every referenced resume just to render a transcript is the
 * wrong trade — so it describes the change instead, and verifies against the
 * document at click time.
 */

export type ActionDone = "applied" | "skipped" | "failed";

export interface ActionCardProps {
  /** Where this lands, e.g. "Experience · Acme Corp". */
  title: string;
  /** Diff mode. */
  before?: string;
  after?: string;
  /** Description mode. */
  description?: string;
  onApply: () => void;
  onSkip?: () => void;
  applying?: boolean;
  /** Terminal state — replaces the buttons with a record of what happened. */
  done?: ActionDone;
  /** Set when the action cannot run; the reason replaces the buttons. */
  unavailable?: string;
}

const DONE_LABEL: Record<ActionDone, string> = {
  applied: "Applied",
  skipped: "Skipped",
  failed: "Could not be applied",
};

export default function ActionCard({
  title,
  before,
  after,
  description,
  onApply,
  onSkip,
  applying = false,
  done,
  unavailable,
}: ActionCardProps) {
  return (
    <li className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </p>

      {description ? (
        <p className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
          {description}
        </p>
      ) : (
        <>
          <p className="mt-0.5 text-sm text-zinc-500 line-through dark:text-zinc-400">
            {before}
          </p>
          <p className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
            {after}
          </p>
        </>
      )}

      <div className="mt-2 flex items-center gap-2">
        {done ? (
          <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {done === "applied" && <CheckIcon className="size-3.5" />}
            {DONE_LABEL[done]}
          </p>
        ) : unavailable ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {unavailable}
          </p>
        ) : (
          <>
            <Button
              variant="soft"
              size="sm"
              onClick={onApply}
              disabled={applying}
              icon={
                applying ? (
                  <SpinnerIcon className="size-3.5" />
                ) : (
                  <CheckIcon className="size-3.5" />
                )
              }
            >
              {applying ? "Applying…" : "Apply"}
            </Button>

            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                disabled={applying}
                icon={<XIcon className="size-3.5" />}
              >
                Skip
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
