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
  /** Reserved for a future icon library; unused today. */
  icon?: React.ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors " +
  "focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background focus-visible:outline-none " +
  "disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-100";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
  secondary:
    "border border-zinc-200 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
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
    </button>
  );
}
