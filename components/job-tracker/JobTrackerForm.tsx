"use client";

import { useState } from "react";

import {
  createEmptyJobApplication,
  JOB_STATUSES,
  STATUS_LABELS,
  type JobApplication,
  type JobApplicationInput,
  type JobApplicationStatus,
} from "@/libs/jobtracker/jobTrackerSchema";

import Button from "../Button";
import { XIcon } from "../icons";
import { Field } from "../resume/fields/Field";

export interface JobTrackerFormProps {
  editing: JobApplication | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: JobApplicationInput) => void;
}

function toInput(application: JobApplication | null): JobApplicationInput {
  if (!application) return createEmptyJobApplication();

  return {
    company: application.company,
    jobTitle: application.jobTitle,
    location: application.location,
    appliedDate: application.appliedDate,
    status: application.status,
    matchScore: application.matchScore,
    nextAction: application.nextAction,
    url: application.url,
  };
}

export default function JobTrackerForm({
  editing,
  saving,
  onClose,
  onSubmit,
}: JobTrackerFormProps) {
  const [draft, setDraft] = useState<JobApplicationInput>(() =>
    toInput(editing),
  );

  const set = <K extends keyof JobApplicationInput>(
    key: K,
    value: JobApplicationInput[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ ...draft, company: draft.company.trim() });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-zinc-200 bg-background dark:border-zinc-800"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {editing ? "Edit application" : "Add an application"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close form"
          className="rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 px-3 py-3 sm:grid-cols-2">
        <Field
          label="Company"
          value={draft.company}
          onChange={(value) => set("company", value)}
          placeholder="Stripe"
        />
        <Field
          label="Role"
          value={draft.jobTitle}
          onChange={(value) => set("jobTitle", value)}
          placeholder="Software Engineer"
        />
        <Field
          label="Location"
          value={draft.location}
          onChange={(value) => set("location", value)}
          placeholder="Remote"
        />
        <Field
          label="Applied date"
          type="date"
          value={draft.appliedDate ?? ""}
          onChange={(value) => set("appliedDate", value || null)}
        />
        <Field
          label="Next action"
          value={draft.nextAction}
          onChange={(value) => set("nextAction", value)}
          placeholder="Follow up on Friday"
        />
        <Field
          label="Match score"
          value={draft.matchScore === null ? "" : String(draft.matchScore)}
          onChange={(value) => {
            const parsed = Number(value);
            set(
              "matchScore",
              value.trim() && Number.isFinite(parsed)
                ? Math.min(100, Math.max(0, Math.round(parsed)))
                : null,
            );
          }}
          placeholder="0–100"
        />
        <Field
          label="URL"
          value={draft.url === null ? "" : String(draft.url)}
          onChange={(value) =>
            set("url", value.trim())
          }
        placeholder="Link your job"
        />

        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Status
          </span>
          <div className="flex flex-wrap gap-1.5">
            {JOB_STATUSES.map((status: JobApplicationStatus) => {
              const selected = draft.status === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => set("status", status)}
                  aria-pressed={selected}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-accent bg-accent-subtle text-accent"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={saving || !draft.company.trim()}
        >
          {saving ? "Saving…" : editing ? "Save" : "Add"}
        </Button>
      </div>
    </form>
  );
}
