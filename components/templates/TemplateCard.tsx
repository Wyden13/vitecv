"use client";

import type { ReactNode } from "react";

import Button from "../Button";
import { KIND_LABELS, type CatalogEntry } from "./catalog";
import DocumentThumbnail from "./DocumentThumbnail";

export interface TemplateCardProps {
  entry: CatalogEntry;
  preview: ReactNode;
  onUse: () => void;
  busy?: boolean;
  disabled?: boolean;
}

export default function TemplateCard({
  entry,
  preview,
  onUse,
  busy = false,
  disabled = false,
}: TemplateCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-background transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
      <div className="border-b border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-hidden rounded-md shadow-sm">
          <DocumentThumbnail>{preview}</DocumentThumbnail>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {entry.name}
          </h3>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {KIND_LABELS[entry.kind]}
          </span>
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {entry.description}
        </p>

        <div className="mt-auto pt-4">
          <Button
            variant="soft"
            className="w-full"
            onClick={onUse}
            disabled={disabled || busy}
          >
            {busy ? "Creating…" : "Use this template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
