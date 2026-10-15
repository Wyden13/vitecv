"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  ACCENT_LIST,
  FONT_PAIR_LIST,
  type DocumentTheme,
} from "@/libs/templateTheme";
import { CheckIcon } from "../icons";

/**
 * Template and theme controls for the editor's Style tab.
 *
 * Generic over the template id so resumes and cover letters share one panel —
 * they differ only in which templates they offer and where "browse all" goes.
 */

export interface StylePanelOption<T extends string> {
  id: T;
  name: string;
  description: string;
}

export interface StylePanelProps<T extends string> {
  templates: StylePanelOption<T>[];
  templateId: T;
  theme: DocumentTheme;
  onTemplateChange: (id: T) => void;
  onThemeChange: (theme: DocumentTheme) => void;
  galleryHref: string;
  /** Miniature of the template, rendered with the live theme. */
  renderThumbnail: (id: T) => ReactNode;
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </h3>
  );
}

export default function StylePanel<T extends string>({
  templates,
  templateId,
  theme,
  onTemplateChange,
  onThemeChange,
  galleryHref,
  renderThumbnail,
}: StylePanelProps<T>) {
  return (
    <div className="px-4 py-5">
      <GroupLabel>Template</GroupLabel>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {templates.map((template) => {
          const selected = template.id === templateId;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateChange(template.id)}
              aria-pressed={selected}
              className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
                selected
                  ? "border-accent ring-1 ring-accent"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              }`}
            >
              <span className="relative block bg-zinc-100 dark:bg-zinc-900">
                {renderThumbnail(template.id)}
                {selected && (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-accent text-white">
                    <CheckIcon className="size-3.5" />
                  </span>
                )}
              </span>

              <span className="px-2.5 py-2">
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {template.name}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                  {template.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <GroupLabel>Accent</GroupLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACCENT_LIST.map((accent) => {
            const selected = accent.id === theme.accent;

            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => onThemeChange({ ...theme, accent: accent.id })}
                aria-pressed={selected}
                title={accent.label}
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition-colors ${
                  selected
                    ? "border-accent text-zinc-900 dark:text-zinc-50"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-5 rounded-full"
                  style={{ backgroundColor: accent.value }}
                />
                {accent.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <GroupLabel>Typeface</GroupLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {FONT_PAIR_LIST.map((pair) => {
            const selected = pair.id === theme.fontPair;

            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => onThemeChange({ ...theme, fontPair: pair.id })}
                aria-pressed={selected}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "border-accent bg-accent-subtle text-accent"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                }`}
                style={{ fontFamily: pair.heading }}
              >
                {pair.label}
              </button>
            );
          })}
        </div>
      </div>

      <Link
        href={galleryHref}
        className="mt-6 inline-block text-sm text-accent hover:underline"
      >
        Browse all templates →
      </Link>
    </div>
  );
}
