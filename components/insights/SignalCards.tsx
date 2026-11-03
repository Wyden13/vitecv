"use client";

import {
  previewAction,
  weakPhraseAction,
  type ActionBlocker,
} from "@/libs/agent/actions";
import {
  KEYWORD_CATEGORIES,
  type Keyword,
  type WeakPhrase,
  type WritingSignals,
} from "@/libs/insights/insightSchema";
import type { TextBlock } from "@/libs/insights/resumeText";
import type { ResumeDocument } from "@/libs/resume/resumeSchema";
import ActionCard from "../agent/ActionCard";
import Meter from "../Meter";
import StatTile from "../StatTile";

/** Blocker copy lives here, with the rest of the user-facing wording. */
const BLOCKED: Record<ActionBlocker, string> = {
  changed: "This wording has changed since the analysis.",
  unsupported: "Edit this one in the resume editor.",
  invalid: "This suggestion is incomplete.",
};

const STALE = "Re-run the analysis to apply this.";

export interface SignalCardsProps {
  keywords: Keyword[];
  signals: WritingSignals;
  blocks: Map<string, TextBlock>;
  /** Null while the resume is still loading. */
  document: ResumeDocument | null;
  /** The analysis no longer describes the resume, so its offsets may be wrong. */
  stale: boolean;
  applyingKey: string | null;
  onApply: (weak: WeakPhrase, key: string) => void;
}

export default function SignalCards({
  keywords,
  signals,
  blocks,
  document,
  stale,
  applyingKey,
  onApply,
}: SignalCardsProps) {
  const categoriesCovered = KEYWORD_CATEGORIES.filter((category) =>
    keywords.some((keyword) => keyword.category === category),
  ).length;

  const share =
    signals.bulletCount > 0
      ? Math.round((signals.quantifiedCount / signals.bulletCount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Keywords found" value={keywords.length} />
        <StatTile
          label="Categories covered"
          value={`${categoriesCovered} of ${KEYWORD_CATEGORIES.length}`}
        />
        <StatTile
          label="Quantified bullets"
          value={`${share}%`}
          hint={`${signals.quantifiedCount} of ${signals.bulletCount} carry a number`}
        />
        <StatTile label="Weak phrases" value={signals.weakPhrases.length} />
      </div>

      {signals.bulletCount > 0 && (
        <Meter
          label="Bullets with a measurable outcome"
          value={signals.quantifiedCount}
          max={signals.bulletCount}
          caption={`${signals.quantifiedCount} of ${signals.bulletCount} bullets`}
        />
      )}

      {signals.weakPhrases.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Weak phrasing
          </h3>

          <ul className="mt-2 flex flex-col gap-2">
            {signals.weakPhrases.map((weak, index) => {
              const key = `${weak.blockId}-${index}`;
              const outcome = document
                ? previewAction(document, weakPhraseAction(weak))
                : null;

              // Falls back to the phrase alone when the action cannot run, so
              // the finding is still readable even where Apply is withheld.
              const before = outcome?.ok ? outcome.preview.before : weak.phrase;
              const after = outcome?.ok
                ? outcome.preview.after
                : weak.suggestion;

              const unavailable = stale
                ? STALE
                : outcome && !outcome.ok
                  ? BLOCKED[outcome.blocker]
                  : undefined;

              return (
                <ActionCard
                  key={key}
                  title={blocks.get(weak.blockId)?.label ?? "Resume"}
                  before={before}
                  after={after}
                  applying={applyingKey === key}
                  unavailable={unavailable}
                  onApply={() => onApply(weak, key)}
                />
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
