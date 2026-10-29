"use client";

export interface ViewOption<T extends string> {
  id: T;
  label: string;
  /**
   * Renders in place of the label, which becomes the accessible name instead.
   * For controls too narrow to spell their options out.
   */
  icon?: React.ReactNode;
}

export interface ViewSwitcherProps<T extends string> {
  options: ViewOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  className?: string;
}

const TRACK =
  "inline-flex max-w-fit gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-0.5 " +
  "dark:border-zinc-700 dark:bg-zinc-800";

const SEGMENT =
  "rounded-full py-1.5 text-xs font-medium transition-colors " +
  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background focus-visible:outline-none";

export default function ViewSwitcher<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: ViewSwitcherProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={[TRACK, className].filter(Boolean).join(" ")}
    >
      {options.map((option) => {
        const selected = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            aria-label={option.icon ? option.label : undefined}
            title={option.icon ? option.label : undefined}
            className={`${SEGMENT} ${option.icon ? "px-2.5" : "px-3.5"} ${
              selected
                ? "bg-background text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            }`}
          >
            {option.icon ?? option.label}
          </button>
        );
      })}
    </div>
  );
}
