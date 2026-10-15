"use client";

import {
  KEYWORD_CATEGORIES,
  type Keyword,
  type WritingSignals,
} from "@/libs/insights/insightSchema";
import type { TextBlock } from "@/libs/insights/resumeText";
import Meter from "../Meter";
import StatTile from "../StatTile";

/**
 * The headline numbers, plus the writing problems worth fixing.
 *
 * Four related figures are a KPI row, not a chart — a grouped bar of
 * "keywords / categories / bullets / phrases" would compare quantities that
 * share no unit. The quantified share is the one ratio here, so it gets a
 * meter.
 *
 * There is deliberately no overall "resume score": nothing in this data
 * justifies one, and a made-up number out of 100 would be the most trusted and
 * least earned thing on the page.
 */

export interface SignalCardsProps {
  keywords: Keyword[];
  signals: WritingSignals;
  blocks: Map<string, TextBlock>;
}

export default function SignalCards({
  keywords,
  signals,
  blocks,
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
            {signals.weakPhrases.map((weak, index) => (
              <li
                key={`${weak.blockId}-${index}`}
                className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {blocks.get(weak.blockId)?.label ?? "Resume"}
                </p>
                <p className="mt-0.5 text-sm text-zinc-500 line-through dark:text-zinc-400">
                  {weak.phrase}
                </p>
                <p className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                  {weak.suggestion}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
