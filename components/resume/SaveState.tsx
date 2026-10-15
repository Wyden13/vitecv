"use client";

import { useEffect, useState } from "react";

import { formatRelativeTime } from "@/libs/formatRelativeTime";
import { CheckIcon, SpinnerIcon } from "../icons";
export interface SaveStateProps {
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
}

export default function SaveState({ saving, savedAt, error }: SaveStateProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (error) {
    return (
      <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
    );
  }

  if (saving) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        <SpinnerIcon className="size-4" />
        Saving…
      </span>
    );
  }

  if (!savedAt) return null;

  return (
    <span className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
      <CheckIcon className="size-4 text-accent" />
      Saved {formatRelativeTime(savedAt, now)}
    </span>
  );
}
