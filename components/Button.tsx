export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "soft"
  | "softAlt";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  /** Rendered after the label — `BASE`'s gap-2 spaces it. */
  iconRight?: React.ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-bold transition-colors " +
  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background focus-visible:outline-none " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover dark:text-zinc-950",
  secondary:
    "border border-zinc-200 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900",
  ghost:
    "text-zinc-600 hover:bg-accent-subtle hover:text-accent dark:text-zinc-400",
  soft: "bg-accent-subtle text-accent hover:bg-accent-subtle-hover",
  softAlt:
    "bg-accent-alt-subtle text-accent-alt hover:bg-accent-alt-subtle-hover",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[BASE, VARIANTS[variant], SIZES[size], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
