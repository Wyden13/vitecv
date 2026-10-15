"use client";

import { useState } from "react";

import {
  CATEGORY_LABELS,
  type RoleGap as RoleGapResult,
  type RoleGapItem,
} from "@/libs/insights/insightSchema";
import Button from "../Button";
import { CheckIcon, PlusIcon, SpinnerIcon } from "../icons";

/**
 * What a target role expects, and which of it the resume already evidences.
 *
 * Presence is a status, so it is carried by **shape and icon**, not hue: a
 * filled chip with a check versus a hollow dashed chip with a plus, under two
 * labelled groups. That is not only the status rule — the app's dark accent and
 * alt-accent (`#50fa7b` / `#ffb86c`) measure ΔE 3.3 under deuteranopia, so a
 * green/orange split would be invisible to some readers in dark mode.
 */

export interface RoleGapProps {
  gap: RoleGapResult | null;
  pending: boolean;
  onRun: (role: string) => void;
}

function Chip({ item }: { item: RoleGapItem }) {
  const Icon = item.present ? CheckIcon : PlusIcon;

  return (
    <span
      title={`${CATEGORY_LABELS[item.category].title} · importance ${item.importance}`}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ${
        item.present
          ? "bg-accent-subtle text-accent"
          : "border border-dashed border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
      }`}
    >
      <Icon className="size-3.5 shrink-0" />
      {item.term}
    </span>
  );
}

function Group({
  title,
  hint,
  items,
}: {
  title: string;
  hint: string;
  items: RoleGapItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}{" "}
        <span className="tabular-nums font-normal normal-case tracking-normal">
          ({items.length})
        </span>
      </h3>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Chip key={item.term} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function RoleGap({ gap, pending, onRun }: RoleGapProps) {
  const [role, setRole] = useState(gap?.role ?? "");

  const present = gap?.items.filter((item) => item.present) ?? [];
  const missing = gap?.items.filter((item) => !item.present) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="insights-role"
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Target role — a job title, or paste the whole description
        </label>
        <textarea
          id="insights-role"
          rows={2}
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Senior Frontend Engineer"
          className="w-full resize-y rounded-md border border-zinc-200 bg-background px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-100"
        />
        <Button
          size="sm"
          className="self-start"
          disabled={pending || !role.trim()}
          icon={
            pending ? <SpinnerIcon className="size-4 animate-spin" /> : undefined
          }
          onClick={() => onRun(role)}
        >
          {pending ? "Comparing…" : gap ? "Compare again" : "Compare"}
        </Button>
      </div>

      {gap && (
        <div
          className={`flex flex-col gap-5 transition-opacity ${
            pending ? "opacity-50" : ""
          }`}
        >
          <Group
            title="Already in your resume"
            hint="The role expects these, and your resume evidences them."
            items={present}
          />
          <Group
            title="Missing"
            hint="Expected for this role, with no supporting evidence in your resume."
            items={missing}
          />
        </div>
      )}
    </div>
  );
}
