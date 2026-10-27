"use client";

import type { ReactNode } from "react";

import type { IconProps } from "@/components/icons";

export interface LibrarySectionProps {
  icon: (props: IconProps) => ReactNode;
  title: string;
  hint?: string;
  /** Omitted for the profile, which holds one record rather than a list. */
  count?: number;
  headerActions?: ReactNode;
  children: ReactNode;
}

export default function LibrarySection({
  icon: Icon,
  title,
  hint,
  count,
  headerActions,
  children,
}: LibrarySectionProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-background dark:border-zinc-800">
      <header className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 shrink-0 text-accent">
            <Icon className="size-5" />
          </span>

          <div className="min-w-0">
            <h2 className="flex items-baseline gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <span className="truncate">{title}</span>
              {count !== undefined && (
                <span className="shrink-0 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {count}
                </span>
              )}
            </h2>
            {hint && (
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                {hint}
              </p>
            )}
          </div>
        </div>

        {headerActions && (
          <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
        )}
      </header>

      <div className="px-4 py-3">{children}</div>
    </section>
  );
}
