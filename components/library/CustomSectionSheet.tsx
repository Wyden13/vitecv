"use client";

import { useState } from "react";

import Button from "@/components/Button";
import Sheet from "@/components/Sheet";
import { Field } from "@/components/resume/fields/Field";
import type { LibrarySectionMeta } from "@/libs/library/librarySchema";
import {
  SECTION_LAYOUTS,
  type SectionLayout,
} from "@/libs/resume/resumeSchema";
import { CUSTOM_PRESETS, LAYOUT_LABELS } from "@/libs/resume/sectionPresets";

export interface CustomSectionSheetProps {
  open: boolean;
  /** Present when renaming an existing section, absent when creating one. */
  editing: LibrarySectionMeta | null;
  saving: boolean;
  onClose: () => void;
  onSave: (values: { heading: string; layout: SectionLayout }) => void;
}

export default function CustomSectionSheet({
  open,
  editing,
  saving,
  onClose,
  onSave,
}: CustomSectionSheetProps) {
  const [heading, setHeading] = useState(editing?.heading ?? "");
  const [layout, setLayout] = useState<SectionLayout>(
    editing?.layout ?? "timeline",
  );

  return (
    <Sheet
      open={open}
      title={editing ? "Rename section" : "Add a custom section"}
      description={
        editing
          ? "The shape of a section is fixed once it holds items."
          : "Name the section and pick the shape its items take."
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !heading.trim()}
            onClick={() => onSave({ heading: heading.trim(), layout })}
          >
            {saving ? "Saving…" : editing ? "Save" : "Add section"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Section name"
          value={heading}
          onChange={setHeading}
          placeholder="Publications"
        />

        <fieldset
          disabled={Boolean(editing)}
          className="flex flex-col gap-2 disabled:opacity-60"
        >
          <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Shape
          </legend>

          {SECTION_LAYOUTS.map((candidate) => {
            const selected = layout === candidate;

            return (
              <button
                key={candidate}
                type="button"
                onClick={() => setLayout(candidate)}
                aria-pressed={selected}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  selected
                    ? "border-accent-border bg-accent-subtle"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                }`}
              >
                <span
                  className={`block text-sm font-medium ${
                    selected
                      ? "text-accent"
                      : "text-zinc-900 dark:text-zinc-50"
                  }`}
                >
                  {LAYOUT_LABELS[candidate]}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">
                  {CUSTOM_PRESETS[candidate].hint}
                </span>
              </button>
            );
          })}
        </fieldset>

        {editing && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Changing the shape would strand the items already saved here, so
            only the name can change. Add a new section if you need a different
            shape.
          </p>
        )}
      </div>
    </Sheet>
  );
}
