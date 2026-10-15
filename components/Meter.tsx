/**
 * A ratio against its limit — the right form for one share, where a two-slice
 * pie would be noise.
 *
 * The track is a lighter step of the fill's own ramp (`accent-subtle` under
 * `accent`), so the bar reads as one object at a glance. The fill is not
 * severity-tinted: there is no defensible threshold at which a share of
 * quantified bullets turns "bad", and colouring one in would invent a judgement
 * the data does not support. The value is always stated in text beside it, so
 * nothing here depends on seeing the bar at all.
 */

export interface MeterProps {
  label: string;
  value: number;
  max: number;
  /** Reads out beside the label, e.g. "8 of 14 bullets". */
  caption?: string;
}

export default function Meter({ label, value, max, caption }: MeterProps) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </p>
        <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {caption ?? `${value} of ${max}`}
        </p>
      </div>

      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-accent-subtle"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${share * 100}%` }}
        />
      </div>
    </div>
  );
}
