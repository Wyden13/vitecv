export interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  /** At most one primary action, per the page rules. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * The empty-list pattern: a floating page whose lines write themselves, a
 * serif headline, and one way forward.
 */
export default function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border border-dashed border-accent-border bg-accent-subtle/40 px-6 py-10 text-center ${className}`}
    >
      <svg viewBox="0 0 160 160" aria-hidden="true" className="size-28">
        <ellipse
          cx="80"
          cy="140"
          rx="40"
          ry="5"
          className="fill-zinc-200 dark:fill-zinc-800"
        />
        <g className="mo-empty-page">
          <rect
            x="44"
            y="24"
            width="72"
            height="96"
            rx="12"
            strokeWidth="3"
            className="fill-white stroke-accent-border dark:fill-zinc-900"
          />
          <rect
            x="56"
            y="38"
            width="20"
            height="20"
            rx="6"
            strokeWidth="2.5"
            className="fill-accent-subtle stroke-accent"
          />
          {[
            ["M56 72h48"],
            ["M56 86h40"],
            ["M56 100h30"],
          ].map(([d]) => (
            <path
              key={d}
              d={d}
              strokeWidth="4"
              strokeLinecap="round"
              className="mo-empty-line stroke-zinc-400"
            />
          ))}
        </g>
        <path
          className="mo-empty-spark fill-accent-alt"
          d="M118 20Q120.5 31.5 132 34Q120.5 36.5 118 48Q115.5 36.5 104 34Q115.5 31.5 118 20Z"
        />
      </svg>
      <h3 className="mt-2 font-serif text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
