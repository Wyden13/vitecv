/**
 * One headline number with its label.
 *
 * A single value is not a chart — a one-bar bar chart says less than the number
 * does. Values use the font's proportional figures, never `tabular-nums`:
 * equal-width digits make a short number look loose at this size, and nothing
 * here aligns into a column.
 */

export interface StatTileProps {
  /** Sentence case, no trailing colon. */
  label: string;
  value: string | number;
  /** Optional context under the value — a ratio, a period, a caveat. */
  hint?: string;
}

export default function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}
