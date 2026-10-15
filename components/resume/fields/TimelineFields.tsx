"use client";

import { createTimelineEntry, type TimelineEntry } from "@/libs/resume/resumeSchema";
import type { TimelineLabels } from "@/libs/resume/sectionPresets";
import Button from "../../Button";
import { PlusIcon, TrashIcon } from "../../icons";
import { Field, TextAreaField } from "./Field";

export interface TimelineFieldsProps {
  value: TimelineEntry[];
  onChange: (next: TimelineEntry[]) => void;
  labels: TimelineLabels;
}

export default function TimelineFields({
  value,
  onChange,
  labels,
}: TimelineFieldsProps) {
  const replace = (index: number, entry: TimelineEntry) => {
    const next = [...value];
    next[index] = entry;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {value.map((entry, index) => (
        <div
          key={entry.id}
          className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Entry {index + 1}
            </span>
            <button
              type="button"
              aria-label={`Remove entry ${index + 1}`}
              onClick={() =>
                onChange(value.filter((candidate) => candidate.id !== entry.id))
              }
              className="rounded p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={labels.title}
              value={entry.title}
              onChange={(next) => replace(index, { ...entry, title: next })}
            />
            <Field
              label={labels.subtitle}
              value={entry.subtitle}
              onChange={(next) => replace(index, { ...entry, subtitle: next })}
            />
            <Field
              label={labels.meta}
              value={entry.meta}
              onChange={(next) => replace(index, { ...entry, meta: next })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Start"
                value={entry.start}
                onChange={(next) => replace(index, { ...entry, start: next })}
                placeholder="Jan 2025"
              />
              <Field
                label="End"
                value={entry.end}
                onChange={(next) => replace(index, { ...entry, end: next })}
                placeholder="Present"
              />
            </div>
          </div>

          <div className="mt-3">
            <TextAreaField
              label="Bullets (one per line)"
              value={entry.bullets.join("\n")}
              onChange={(next) =>
                replace(index, {
                  ...entry,
                  bullets: next.split("\n"),
                })
              }
              placeholder={"Built X that did Y\nReduced Z by 40%"}
            />
          </div>
        </div>
      ))}

      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        icon={<PlusIcon className="size-4" />}
        onClick={() => onChange([...value, createTimelineEntry()])}
      >
        {labels.addLabel}
      </Button>
    </div>
  );
}
