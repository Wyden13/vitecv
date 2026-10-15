"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import type { ResumeTemplateId } from "@/libs/resumeSchema";
import { createBlankResume } from "@/libs/resumeService";
import { DEFAULT_THEME, type DocumentTheme } from "@/libs/templateTheme";
import { useToast } from "../Toast";
import {
  KIND_LABELS,
  TEMPLATE_CATALOG,
  type CatalogEntry,
  type TemplateKind,
} from "./catalog";
import TemplateCard from "./TemplateCard";
import TemplatePreview from "./TemplatePreview";

type Filter = TemplateKind | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "resume", label: KIND_LABELS.resume },
  { id: "coverLetter", label: KIND_LABELS.coverLetter },
];

export interface TemplateGalleryProps {
  defaultFilter: TemplateKind;
}

export default function TemplateGallery({
  defaultFilter,
}: TemplateGalleryProps) {
  const router = useRouter();
  const { user, loading } = useFirebaseUser();
  const { notify } = useToast();

  // Filter state is local rather than a search param: reading searchParams
  // would make this route request-time data and need its own Suspense
  // boundary under `cacheComponents`, for a control nothing links into.
  const [filter, setFilter] = useState<Filter>(defaultFilter);
  const [theme, setTheme] = useState<DocumentTheme>(DEFAULT_THEME);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const visible = TEMPLATE_CATALOG.filter(
    (entry) => filter === "all" || entry.kind === filter,
  );

  const use = async (entry: CatalogEntry) => {
    if (!user) return;

    setCreatingId(entry.id);
    try {
      if (entry.kind === "resume") {
        const id = await createBlankResume(user.uid, {
          templateId: entry.id as ResumeTemplateId,
          title: `${entry.name} resume`,
        });
        router.push(`/resume/${id}`);
      }
    } catch (caught) {
      setCreatingId(null);
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not create the document.",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter templates"
          className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
        >
          {FILTERS.map((option) => {
            const selected = option.id === filter;

            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(option.id)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "bg-background font-medium text-zinc-900 shadow-sm dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Preview accent
          </span>
          {(["emerald", "navy", "burgundy", "slate"] as const).map((accent) => (
            <button
              key={accent}
              type="button"
              onClick={() => setTheme({ ...theme, accent })}
              aria-label={`Preview in ${accent}`}
              aria-pressed={theme.accent === accent}
              className={`size-5 rounded-full border-2 transition-colors ${
                theme.accent === accent
                  ? "border-zinc-900 dark:border-zinc-50"
                  : "border-transparent"
              }`}
              style={{
                backgroundColor: {
                  emerald: "#047857",
                  navy: "#1e3a8a",
                  burgundy: "#9f1239",
                  slate: "#334155",
                }[accent],
              }}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
          No templates in this category yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => (
            <TemplateCard
              key={`${entry.kind}:${entry.id}`}
              entry={entry}
              preview={<TemplatePreview entry={entry} theme={theme} />}
              onUse={() => void use(entry)}
              busy={creatingId === entry.id}
              disabled={loading || !user || creatingId !== null}
            />
          ))}
        </div>
      )}

      {!loading && !user && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to start a document from a template.
        </p>
      )}
    </div>
  );
}
