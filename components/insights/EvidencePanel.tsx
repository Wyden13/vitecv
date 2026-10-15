"use client";

import type { Keyword } from "@/libs/insights/insightSchema";
import type { TextBlock } from "@/libs/insights/resumeText";

/**
 * Where a keyword's weight came from.
 *
 * This is what separates a number you can check from one you have to believe.
 * Citations were filtered to real block ids when the analysis was validated, so
 * anything shown here is text that is genuinely in the resume — and a citation
 * into a line since deleted disappears instead of lying.
 */

export interface EvidencePanelProps {
  keyword: Keyword | null;
  blocks: Map<string, TextBlock>;
}

export default function EvidencePanel({ keyword, blocks }: EvidencePanelProps) {
  if (!keyword) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Select a keyword to see the lines it was found in.
      </p>
    );
  }

  const cited = keyword.blockIds
    .map((id) => blocks.get(id))
    .filter((block): block is TextBlock => Boolean(block));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {keyword.term}
        </h3>
        <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          weight {keyword.weight} · {keyword.count}{" "}
          {keyword.count === 1 ? "mention" : "mentions"}
        </span>
      </div>

      {cited.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          No source lines are on record for this keyword.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {cited.map((block) => (
            <li
              key={block.id}
              className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {block.label}
              </p>
              <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
                {block.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
