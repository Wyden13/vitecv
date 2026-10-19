"use client";

export interface ViewOption<T extends string> {
  id: T;
  label: string;
}

export interface ViewSwitcherProps<T extends string> {
  options: ViewOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Names the control for screen readers, e.g. "Result views". */
  label: string;
  className?: string;
}

const TRACK =
  "inline-flex max-w-fit gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-1 " +
  "dark:border-zinc-700 dark:bg-zinc-800";

const SEGMENT =
  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors " +
  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background focus-visible:outline-none";

/**
 * A segmented control: one track, one raised pill for the active view.
 *
 * Toggle buttons in a labelled group rather than a tablist — `role="tab"` is
 * only honest with `aria-controls` pointing at a `role="tabpanel"`, and no
 * caller here wires one up.
 *
 * The active pill is lighter than its track in both themes: `bg-background` is
 * darker than `zinc-800` under Dracula, which would read as a hole rather than
 * a raised segment, hence the explicit `dark:bg-zinc-700`.
 *
 * Inactive labels are a step darker/lighter than the usual `zinc-500` /
 * `zinc-400` body pair: against the track rather than a card those land at
 * 4.40:1 and 4.19:1, just short of AA. `zinc-600` / `zinc-300` give 7.03:1 and
 * 5.42:1.
 */
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
            className={`${SEGMENT} ${
              selected
                ? "bg-background text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
