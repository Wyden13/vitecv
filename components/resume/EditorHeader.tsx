"use client";

import Link from "next/link";

import Button from "../Button";
import { DownloadIcon } from "../icons";
import SaveState, { type SaveStateProps } from "./SaveState";

export type EditorTab = "editor" | "style";

const TABS: { id: EditorTab; label: string }[] = [
  { id: "editor", label: "Editor" },
  { id: "style", label: "Style" },
];

export interface EditorHeaderProps extends SaveStateProps {
  title: string;
  onTitleChange: (title: string) => void;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  /** Breadcrumb target — the list this document belongs to. */
  backHref?: string;
  backLabel?: string;
  /** Accessible name and placeholder for the title input. */
  titleLabel?: string;
}

export default function EditorHeader({
  title,
  onTitleChange,
  activeTab,
  onTabChange,
  backHref = "/resume",
  backLabel = "Resume builder",
  titleLabel = "Resume title",
  ...saveState
}: EditorHeaderProps) {
  return (
    <header className="print:hidden">
      <div className="flex items-center gap-4 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
          <Link
            href={backHref}
            className="shrink-0 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {backLabel}
          </Link>
          <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
            /
          </span>
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label={titleLabel}
            placeholder={`Untitled ${titleLabel.replace(" title", "").toLowerCase()}`}
            className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-sm font-medium text-zinc-900 outline-none hover:bg-zinc-100 focus:bg-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900 dark:focus:ring-zinc-100"
          />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <SaveState {...saveState} />

          <Button variant="secondary" size="sm" disabled title="Coming soon">
            Job Match
          </Button>
          {/*
            The print stylesheet already reduces the page to the preview pane
            at full scale on Letter paper, so the browser's own dialog is the
            PDF export — no renderer to ship.
          */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            title="Print or save as PDF"
            icon={<DownloadIcon className="size-4" />}
          >
            Download
          </Button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Editor views"
        className="flex items-center gap-1 border-b border-zinc-200 px-6 dark:border-zinc-800"
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={`border-b-2 px-3 py-2 text-sm transition-colors ${
                selected
                  ? "border-accent font-medium text-accent"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
