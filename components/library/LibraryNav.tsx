"use client";

import { PlusIcon, UploadIcon } from "@/components/icons";
import type { LibrarySectionDescriptor } from "@/libs/library/librarySchema";
import { sectionIcon } from "./sectionIcons";

export interface LibraryNavProps {
  sections: LibrarySectionDescriptor[];
  /** Item totals by section key; the profile has no entry. */
  counts: Map<string, number>;
  selectedKey: string;
  onSelect: (key: string) => void;
  onAddSection: () => void;
  onImport: () => void;
}

const BASE =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors";

const INACTIVE =
  "text-zinc-600 hover:bg-accent-subtle hover:text-accent dark:text-zinc-400";

const ACTIVE = "bg-accent-subtle-hover font-medium text-accent";

const FOOTER_ACTION =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs " +
  "text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 " +
  "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

export default function LibraryNav({
  sections,
  counts,
  selectedKey,
  onSelect,
  onAddSection,
  onImport,
}: LibraryNavProps) {
  return (
    <nav aria-label="Library sections" className="flex flex-col gap-1">
      {sections.map((section) => {
        const Icon = sectionIcon(section.presetId);
        const active = section.key === selectedKey;
        const count = counts.get(section.key);

        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onSelect(section.key)}
            aria-current={active ? "true" : undefined}
            className={`${BASE} ${active ? ACTIVE : INACTIVE}`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{section.heading}</span>
            {count !== undefined && (
              <span className="shrink-0 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                {count}
              </span>
            )}
          </button>
        );
      })}

      <div className="mt-2 flex flex-col gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
        <button type="button" onClick={onAddSection} className={FOOTER_ACTION}>
          <PlusIcon className="size-4 shrink-0" />
          Add custom section
        </button>
        <button type="button" onClick={onImport} className={FOOTER_ACTION}>
          <UploadIcon className="size-4 shrink-0" />
          Import from resume
        </button>
      </div>
    </nav>
  );
}
