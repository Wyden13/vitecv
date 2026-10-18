import Meter from "../Meter";
import { AlertTriangleIcon, CheckIcon } from "../icons";
import type { MatchScore as MatchScoreValue } from "@/libs/insights/insightSchema";

export interface MatchScoreProps {
  value: MatchScoreValue;
}

function Tally({
  icon: Icon,
  label,
  count,
  tone,
}: {
  icon: typeof CheckIcon;
  label: string;
  count: number;
  tone: "accent" | "alt";
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon
        className={`size-4 shrink-0 ${
          tone === "accent" ? "text-accent" : "text-accent-alt"
        }`}
      />
      <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {count}
      </span>
    </div>
  );
}

/**
 * The headline fit number.
 *
 * Deliberately a hero number over a meter rather than the two-segment donut the
 * inspiration used: a single ratio against a limit is a meter, and a two-slice
 * pie is the canonical way to make one value harder to read than printing it.
 *
 * The bar tracks the weighted score, not the raw count, so the number and the
 * fill always agree — the count is context, and lives in the caption.
 */
export default function MatchScore({ value }: MatchScoreProps) {
  const { score, matched, total } = value;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-bold tabular-nums tracking-tight text-accent">
          {score}%
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          overall match
        </p>
      </div>

      <Meter
        label="Weighted by how much the role asks for each requirement"
        value={score}
        max={100}
        caption={`${matched} of ${total} requirements`}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Tally icon={CheckIcon} label="Matched" count={matched} tone="accent" />
        <Tally
          icon={AlertTriangleIcon}
          label="Missing"
          count={total - matched}
          tone="alt"
        />
      </div>
    </div>
  );
}
