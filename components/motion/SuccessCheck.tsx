export interface SuccessCheckProps {
  className?: string;
  label?: string;
}

/** Ring and tick draw on, then a small sparkle lands. Plays once on mount. */
export default function SuccessCheck({
  className = "size-12",
  label = "Done",
}: SuccessCheckProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={className}
    >
      <circle cx="48" cy="48" r="40" className="fill-accent-good-subtle" />
      <circle
        className="mo-ok-ring stroke-accent-good"
        cx="48"
        cy="48"
        r="40"
        fill="none"
        strokeWidth="4"
      />
      <path
        className="mo-ok-tick stroke-accent-good"
        d="M32 49 43 60 65 37"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="mo-ok-spark fill-accent-alt"
        d="M76 10Q77.8 18.2 86 20Q77.8 21.8 76 30Q74.2 21.8 66 20Q74.2 18.2 76 10Z"
      />
    </svg>
  );
}
