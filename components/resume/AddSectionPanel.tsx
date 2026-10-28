"use client";

import { useState } from "react";

import { SECTION_LAYOUTS, type SectionLayout } from "@/libs/resume/resumeSchema";
import {
  CUSTOM_PRESETS,
  LAYOUT_LABELS,
  PRESET_GROUPS,
  SECTION_PRESETS,
  type SectionPreset,
} from "@/libs/resume/sectionPresets";
import Button from "../Button";
import { LayoutGridIcon, PlusIcon, XIcon } from "../icons";
import { Field } from "./fields/Field";

export interface AddSectionPanelProps {
  usedPresetIds: string[];
  onAdd: (preset: SectionPreset, heading?: string) => void;
  /** Opens the library drawer, which the parent owns. */
  onPullFromLibrary: () => void;
}

export default function AddSectionPanel({
  usedPresetIds,
  onAdd,
  onPullFromLibrary,
}: AddSectionPanelProps) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customHeading, setCustomHeading] = useState("");
  const [customLayout, setCustomLayout] = useState<SectionLayout>("timeline");

  const close = () => {
    setOpen(false);
    setCustomOpen(false);
    setCustomHeading("");
    setCustomLayout("timeline");
  };

  const add = (preset: SectionPreset, heading?: string) => {
    onAdd(preset, heading);
    close();
  };

  if (!open) {
    return (
      <div className="flex gap-2 px-4 py-5">
        <Button
          variant="soft"
          className="flex-1 border-dashed"
          icon={<PlusIcon className="size-4" />}
          onClick={() => setOpen(true)}
        >
          Add section
        </Button>
        <Button
          variant="secondary"
          className="flex-1 border-dashed"
          icon={<LayoutGridIcon className="size-4" />}
          onClick={onPullFromLibrary}
        >
          From Library
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Add a section
          </h3>
          <button
            type="button"
            onClick={close}
            aria-label="Close add section"
            className="rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto px-3 py-3">
          {PRESET_GROUPS.map((group) => {
            const presets = SECTION_PRESETS.filter(
              (preset) => preset.group === group,
            );
            if (presets.length === 0) return null;

            return (
              <div key={group} className="mb-4 last:mb-0">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {group}
                </h4>

                <div className="mt-1.5 flex flex-col">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => add(preset)}
                      className="flex w-full items-start justify-between gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {preset.heading}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                          {preset.hint}
                        </span>
                      </span>
                      {usedPresetIds.includes(preset.id) && (
                        <span className="shrink-0 rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent">
                          Added
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
          {customOpen ? (
            <div className="flex flex-col gap-3">
              <Field
                label="Heading"
                value={customHeading}
                onChange={setCustomHeading}
                placeholder="Conference Talks"
              />

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Fields
                </span>
                <div className="flex flex-wrap gap-2">
                  {SECTION_LAYOUTS.map((layout) => {
                    const selected = layout === customLayout;

                    return (
                      <button
                        key={layout}
                        type="button"
                        onClick={() => setCustomLayout(layout)}
                        aria-pressed={selected}
                        className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${selected
                          ? "border-accent bg-accent-subtle text-accent"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                          }`}
                      >
                        {LAYOUT_LABELS[layout]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!customHeading.trim()}
                  onClick={() =>
                    add(CUSTOM_PRESETS[customLayout], customHeading)
                  }
                >
                  Add section
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              icon={<PlusIcon className="size-4" />}
              onClick={() => setCustomOpen(true)}
            >
              Custom section
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
