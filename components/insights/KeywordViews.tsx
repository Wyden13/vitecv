"use client";

import {
  CATEGORY_LABELS,
  KEYWORD_CATEGORIES,
  type Keyword,
  type KeywordCategory,
} from "@/libs/insights/insightSchema";
import type { TextBlock } from "@/libs/insights/resumeText";

export type KeywordView = "cloud" | "ranked" | "table";

export const KEYWORD_VIEWS: { id: KeywordView; label: string }[] = [
  { id: "cloud", label: "Cloud" },
  { id: "ranked", label: "Ranked" },
  { id: "table", label: "Table" },
];

export interface KeywordViewsProps {
  keywords: Keyword[];
  view: KeywordView;
  blocks: Map<string, TextBlock>;
  selectedTerm: string | null;
  onSelect: (keyword: Keyword) => void;
}

/** Five size steps — enough to rank at a glance, few enough to stay readable. */
const CHIP_SIZES = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
] as const;

function chipSize(weight: number): string {
  const step = Math.min(
    CHIP_SIZES.length - 1,
    Math.floor((weight / 100) * CHIP_SIZES.length),
  );
  return CHIP_SIZES[step];
}

function byCategory(keywords: Keyword[]) {
  return KEYWORD_CATEGORIES.map((category) => ({
    category,
    items: keywords.filter((keyword) => keyword.category === category),
  })).filter((group) => group.items.length > 0);
}

function GroupHeading({ category }: { category: KeywordCategory }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {CATEGORY_LABELS[category].title}
    </h3>
  );
}

function whereText(keyword: Keyword, blocks: Map<string, TextBlock>): string {
  const labels = [
    ...new Set(
      keyword.blockIds
        .map((id) => blocks.get(id)?.label)
        .filter((label): label is string => Boolean(label)),
    ),
  ];

  return labels.join(", ") || "—";
}

export default function KeywordViews({
  keywords,
  view,
  blocks,
  selectedTerm,
  onSelect,
}: KeywordViewsProps) {
  const groups = byCategory(keywords);

  if (keywords.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No keywords yet — run an analysis to see what this resume emphasises.
      </p>
    );
  }

  if (view === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2 pr-4 font-medium text-zinc-600 dark:text-zinc-400">
                Keyword
              </th>
              <th className="py-2 pr-4 font-medium text-zinc-600 dark:text-zinc-400">
                Category
              </th>
              <th className="py-2 pr-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                Weight
              </th>
              <th className="py-2 pr-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                Mentions
              </th>
              <th className="py-2 font-medium text-zinc-600 dark:text-zinc-400">
                Where
              </th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((keyword) => (
              <tr
                key={keyword.term}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                  {keyword.term}
                </td>
                <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">
                  {CATEGORY_LABELS[keyword.category].title}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-zinc-900 dark:text-zinc-50">
                  {keyword.weight}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                  {keyword.count}
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">
                  {whereText(keyword, blocks)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (view === "ranked") {
    return (
      <div className="flex flex-col gap-6">
        {groups.map(({ category, items }) => (
          <div key={category}>
            <GroupHeading category={category} />

            <div className="mt-2 flex flex-col gap-1.5">
              {items.map((keyword) => (
                <button
                  key={keyword.term}
                  type="button"
                  onClick={() => onSelect(keyword)}
                  aria-pressed={selectedTerm === keyword.term}
                  className={`group grid grid-cols-[minmax(6rem,10rem)_1fr_2.5rem] items-center gap-3 rounded px-1 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                    selectedTerm === keyword.term
                      ? "bg-zinc-100 dark:bg-zinc-900"
                      : ""
                  }`}
                >
                  <span className="truncate text-sm text-zinc-900 dark:text-zinc-50">
                    {keyword.term}
                  </span>

                  {/* One shared baseline, one colour for every bar: the length
                      is the value, so a tint ramp would say it twice. */}
                  <span className="h-2.5 w-full overflow-hidden rounded-r-[4px]">
                    <span
                      className="block h-full rounded-r-[4px] bg-accent"
                      style={{ width: `${Math.max(keyword.weight, 2)}%` }}
                    />
                  </span>

                  <span className="text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                    {keyword.weight}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ category, items }) => (
        <div key={category}>
          <GroupHeading category={category} />

          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            {items.map((keyword) => (
              <button
                key={keyword.term}
                type="button"
                onClick={() => onSelect(keyword)}
                aria-pressed={selectedTerm === keyword.term}
                // The weight is in the accessible name, not just the tooltip:
                // size alone would gate the value behind eyesight.
                aria-label={`${keyword.term}, weight ${keyword.weight} of 100`}
                title={`Weight ${keyword.weight} · ${keyword.count} mention${
                  keyword.count === 1 ? "" : "s"
                }`}
                className={`rounded-md px-2 py-1 leading-none transition-colors ${chipSize(
                  keyword.weight,
                )} ${
                  selectedTerm === keyword.term
                    ? "bg-accent text-white dark:text-zinc-900"
                    : "bg-accent-subtle text-accent hover:bg-accent-subtle-hover"
                }`}
              >
                {keyword.term}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
