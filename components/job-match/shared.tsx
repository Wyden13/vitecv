import {
  CATEGORY_LABELS,
  type RoleGapItem,
} from "@/libs/insights/insightSchema";

import { AlertTriangleIcon, CheckIcon } from "../icons";

export const CARD =
  "rounded-lg border border-zinc-200 bg-background p-5 dark:border-zinc-800";

export function Chip({ item }: { item: RoleGapItem }) {
  const Icon = item.present ? CheckIcon : AlertTriangleIcon;

  return (
    <span
      title={`${CATEGORY_LABELS[item.category].title} · importance ${item.importance}`}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ${
        item.present
          ? "bg-accent-subtle text-accent"
          : "bg-accent-alt-subtle text-accent-alt"
      }`}
    >
      <Icon className="size-3.5 shrink-0" />
      {item.term}
    </span>
  );
}

export function SectionHeading({
  title,
  count,
  hint,
}: {
  title: string;
  count?: number;
  hint?: string;
}) {
  return (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
        {count !== undefined && (
          <>
            {" "}
            <span className="font-normal normal-case tracking-normal tabular-nums">
              ({count})
            </span>
          </>
        )}
      </h3>

      {hint && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </>
  );
}
