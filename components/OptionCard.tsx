import Button, { type ButtonVariant } from "./Button";

export type OptionCardTone = "neutral" | "accent" | "accentAlt";

export interface OptionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  action?: React.ReactNode;
  tone?: OptionCardTone;
  badge?: string;
}

const CARD_BORDER: Record<OptionCardTone, string> = {
  neutral:"border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
  accent: "border-accent-border",
  accentAlt:"border-zinc-200 hover:border-accent-alt-border dark:border-zinc-800",
};

const CHIP: Record<OptionCardTone, string> = {
  neutral: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
  accent: "bg-accent-subtle text-accent",
  accentAlt: "bg-accent-alt-subtle text-accent-alt",
};

const ACTION_VARIANT: Record<OptionCardTone, ButtonVariant> = {
  neutral: "secondary",
  accent: "soft",
  accentAlt: "softAlt",
};

export default function OptionCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  action,
  tone = "neutral",
  badge,
}: OptionCardProps) {
  return (
    <div className={`relative flex flex-col rounded-2xl border bg-background p-6 text-center transition-colors ${CARD_BORDER[tone]}`}>
      {badge ? (
        <span className="absolute right-3 top-3 rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent">
          {badge}
        </span>
      ) : null}

      <div className={`mx-auto flex size-12 items-center justify-center rounded-xl ${CHIP[tone]}`}>
        <Icon className="size-6" />
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>

      <div className="mt-auto pt-6">
        {action ?? (
          <Button
            variant={ACTION_VARIANT[tone]}
            className="w-full"
            icon={<Icon className="size-4" />}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
