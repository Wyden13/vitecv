"use client";

import { useState } from "react";

import Button from "@/components/Button";
import Sheet from "@/components/Sheet";
import { Field, TextAreaField } from "@/components/resume/fields/Field";
import {
  libraryItemHasContent,
  type LibraryItemInput,
  type LibrarySectionDescriptor,
} from "@/libs/library/librarySchema";
import { presetForLayout } from "@/libs/resume/sectionPresets";

/**
 * Edits exactly one library item. `TimelineFields` and `SkillFields` are not
 * reused here: they are array editors that bring their own add and remove
 * chrome, which a one-item drawer does not want. The field *labels* still come
 * from the section's preset, so Education asks for a School and Certificates
 * for an Issuer with no second label table.
 *
 * The parent passes `key={editing?.id ?? "new"}` so the draft below reseeds
 * whenever a different item opens — the `JobTrackerForm` pattern.
 */
export interface LibraryItemSheetProps {
  open: boolean;
  section: LibrarySectionDescriptor;
  initial: LibraryItemInput;
  /** False when adding, which only changes the drawer's wording. */
  editing: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: LibraryItemInput) => void;
}

export default function LibraryItemSheet({
  open,
  section,
  initial,
  editing,
  saving,
  onClose,
  onSave,
}: LibraryItemSheetProps) {
  const [draft, setDraft] = useState<LibraryItemInput>(initial);

  return (
    <Sheet
      open={open}
      title={`${editing ? "Edit" : "Add"} ${section.heading.toLowerCase()} item`}
      description={section.hint}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !libraryItemHasContent(draft)}
            onClick={() => onSave(draft)}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      {draft.layout === "timeline" &&
        (() => {
          const { labels } = presetForLayout(section.presetId, "timeline");
          const { entry } = draft;
          const setEntry = (patch: Partial<typeof entry>) =>
            setDraft({ ...draft, entry: { ...entry, ...patch } });

          return (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={labels.title}
                  value={entry.title}
                  onChange={(next) => setEntry({ title: next })}
                />
                <Field
                  label={labels.subtitle}
                  value={entry.subtitle}
                  onChange={(next) => setEntry({ subtitle: next })}
                />
                {labels.meta && (
                  <Field
                    label={labels.meta}
                    value={entry.meta}
                    onChange={(next) => setEntry({ meta: next })}
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Start"
                    value={entry.start}
                    onChange={(next) => setEntry({ start: next })}
                    placeholder="Jan 2025"
                  />
                  <Field
                    label="End"
                    value={entry.end}
                    onChange={(next) => setEntry({ end: next })}
                    placeholder="Present"
                  />
                </div>
              </div>

              {labels.description && (
                <TextAreaField
                  label={labels.description}
                  value={entry.description}
                  onChange={(next) => setEntry({ description: next })}
                  placeholder="What it is, what you built it with, who it was for."
                />
              )}

              {labels.url && (
                <Field
                  label={labels.url}
                  type="url"
                  value={entry.url}
                  onChange={(next) => setEntry({ url: next })}
                  placeholder="https://github.com/you/project"
                />
              )}

              <TextAreaField
                label="Bullets (one per line)"
                value={entry.bullets.join("\n")}
                onChange={(next) => setEntry({ bullets: next.split("\n") })}
                placeholder={"Built X that did Y\nReduced Z by 40%"}
              />
            </div>
          );
        })()}

      {draft.layout === "skills" &&
        (() => {
          const { labels } = presetForLayout(section.presetId, "skills");
          const { group } = draft;

          return (
            <div className="flex flex-col gap-3">
              <Field
                label={labels.group}
                value={group.group}
                onChange={(next) =>
                  setDraft({ ...draft, group: { ...group, group: next } })
                }
                placeholder="Languages"
              />
              <Field
                label={labels.items}
                value={group.items.join(", ")}
                onChange={(next) =>
                  setDraft({
                    ...draft,
                    group: {
                      ...group,
                      items: next.split(",").map((item) => item.trim()),
                    },
                  })
                }
                placeholder="Java, TypeScript, Python"
              />
            </div>
          );
        })()}

      {draft.layout === "text" &&
        (() => {
          const { labels } = presetForLayout(section.presetId, "text");

          return (
            <TextAreaField
              label={labels.field}
              value={draft.body}
              onChange={(next) => setDraft({ ...draft, body: next })}
              placeholder={labels.placeholder}
              rows={8}
            />
          );
        })()}

      {draft.layout === "list" &&
        (() => {
          const { labels } = presetForLayout(section.presetId, "list");

          return (
            <TextAreaField
              label={labels.field}
              value={draft.items.join("\n")}
              onChange={(next) =>
                setDraft({ ...draft, items: next.split("\n") })
              }
              placeholder={labels.placeholder}
              rows={8}
            />
          );
        })()}
    </Sheet>
  );
}
