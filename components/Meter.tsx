export interface MeterProps {
  label: string;
  value: number;
  max: number;
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
