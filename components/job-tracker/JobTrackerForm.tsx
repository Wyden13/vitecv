"use client";

import { useId, useState } from "react";

import {
  JOB_STATUSES,
  STATUS_LABELS,
  cleanJobApplicationInput,
  createEmptyJobApplication,
  hasErrors,
  todayISO,
  validateJobApplication,
  type JobApplication,
  type JobApplicationField,
  type JobApplicationInput,
  type JobApplicationStatus,
} from "@/libs/jobtracker/jobTrackerSchema";

import Button from "../Button";
import { ChevronDownIcon } from "../icons";
import { Field, TextAreaField } from "../resume/fields/Field";
import Sheet from "../Sheet";

export interface JobTrackerFormProps {
  open: boolean;
  editing: JobApplication | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: JobApplicationInput) => void;
}

/**
 * Listed field by field rather than spread, so adding one to the schema is a
 * compile error here instead of silent data loss: this is the only place that
 * turns a stored application back into an editable draft, and the posting
 * fields it carries through are the ones the extension clipped.
 */
function toInput(application: JobApplication | null): JobApplicationInput {
  if (!application) return createEmptyJobApplication();

  return {
    company: application.company,
    jobTitle: application.jobTitle,
    location: application.location,
    salary: application.salary,
    url: application.url,
    appliedDate: application.appliedDate,
    status: application.status,
    nextAction: application.nextAction,
    notes: application.notes,
    matchScore: application.matchScore,
    description: application.description,
    employmentType: application.employmentType,
    datePosted: application.datePosted,
    source: application.source,
  };
}

/** A labelled band of fields in the sheet body. */
function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Something the tracker owns and the form must not pretend you can type. */
function ReadOnlyRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <p className="rounded-md border border-dashed border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
        {value}
      </p>
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}

function StatusPicker({
  value,
  onChange,
}: {
  value: JobApplicationStatus;
  onChange: (status: JobApplicationStatus) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
      <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Status
      </legend>

      <div className="flex flex-wrap gap-1.5">
        {JOB_STATUSES.map((status) => {
          const selected = value === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => onChange(status)}
              aria-pressed={selected}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "border-accent-border bg-accent-subtle text-accent"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function JobTrackerForm({
  open,
  editing,
  saving,
  onClose,
  onSubmit,
}: JobTrackerFormProps) {
  const [draft, setDraft] = useState<JobApplicationInput>(() =>
    toInput(editing),
  );
  const [touched, setTouched] = useState<
    Partial<Record<JobApplicationField, true>>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const formId = useId();
  const errors = validateJobApplication(draft);
  const today = todayISO();

  const set = <K extends JobApplicationField>(
    key: K,
    value: JobApplicationInput[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const touch = (key: JobApplicationField) => () =>
    setTouched((current) => ({ ...current, [key]: true }));

  /**
   * An error only reads as help once you have had a go at the field. Before
   * that it is a form scolding you for not having filled it in yet, so a
   * message waits for a blur — or for you to press Save.
   */
  const errorFor = (key: JobApplicationField) =>
    submitted || touched[key] ? errors[key] : undefined;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    // Save stays enabled on purpose: a disabled button cannot tell you what
    // is wrong, and the whole point of the messages is that they can.
    if (hasErrors(errors)) return;

    onSubmit(cleanJobApplicationInput(draft));
  };

  const postingFilled = [
    draft.description,
    draft.employmentType,
    draft.datePosted,
    draft.source,
  ].filter((value) => Boolean(value?.trim())).length;

  return (
    <Sheet
      open={open}
      title={editing ? "Edit application" : "Add an application"}
      description={
        editing
          ? "Posting details are kept as clipped unless you change them."
          : "Only the company is required — fill in the rest as you learn it."
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} size="sm" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save" : "Add"}
          </Button>
        </>
      }
    >
      {/*
        `id` here plus `form={formId}` on the footer button is what connects a
        submit button living outside this element — Sheet renders its footer as
        a sibling of the body, not inside it. `noValidate` hands validation to
        us so the browser's own bubbles cannot pre-empt the inline messages.
      */}
      <form
        id={formId}
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-6"
      >
        <Group title="The role">
          <Field
            label="Company"
            required
            value={draft.company}
            error={errorFor("company")}
            onChange={(value) => set("company", value)}
            onBlur={touch("company")}
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
            label="Salary"
            value={draft.salary}
            onChange={(value) => set("salary", value)}
            placeholder="120k–140k"
            hint="However the posting puts it."
          />

          <div className="sm:col-span-2">
            <Field
              label="Posting URL"
              value={draft.url}
              error={errorFor("url")}
              onChange={(value) => set("url", value)}
              onBlur={touch("url")}
              placeholder="https://stripe.com/jobs/1234"
            />
          </div>
        </Group>

        <Group title="Your application">
          <StatusPicker
            value={draft.status}
            onChange={(status) => set("status", status)}
          />

          <Field
            label="Applied date"
            type="date"
            max={today}
            value={draft.appliedDate ?? ""}
            error={errorFor("appliedDate")}
            onChange={(value) => set("appliedDate", value || null)}
            onBlur={touch("appliedDate")}
          />
          <Field
            label="Next action"
            value={draft.nextAction}
            onChange={(value) => set("nextAction", value)}
            placeholder="Follow up on Friday"
          />

          <div className="sm:col-span-2">
            <TextAreaField
              label="Notes"
              rows={4}
              value={draft.notes}
              onChange={(value) => set("notes", value)}
              placeholder="Referred by Sam. Team of six. Asked about on-call."
              hint="Yours, not the posting's."
            />
          </div>

          <ReadOnlyRow
            label="Match score"
            value={
              draft.matchScore === null
                ? "Not scored yet"
                : `${draft.matchScore}%`
            }
            hint="Set by Job Match."
          />
        </Group>

        <details className="group rounded-lg border border-zinc-200 dark:border-zinc-800">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 [&::-webkit-details-marker]:hidden dark:text-zinc-400">
            <span>
              Posting details{" "}
              <span className="font-normal normal-case tracking-normal tabular-nums">
                ({postingFilled})
              </span>
            </span>
            <ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>

          <div className="grid gap-3 border-t border-zinc-200 px-3 py-3 sm:grid-cols-2 dark:border-zinc-800">
            <Field
              label="Employment type"
              value={draft.employmentType ?? ""}
              onChange={(value) => set("employmentType", value || null)}
              placeholder="Full-time"
            />
            <Field
              label="Date posted"
              type="date"
              max={today}
              value={draft.datePosted ?? ""}
              error={errorFor("datePosted")}
              onChange={(value) => set("datePosted", value || null)}
              onBlur={touch("datePosted")}
              hint="When the employer posted it."
            />

            <div className="sm:col-span-2">
              <TextAreaField
                label="Description"
                rows={8}
                value={draft.description}
                onChange={(value) => set("description", value)}
                placeholder="Pasted or clipped from the posting"
              />
            </div>

            {draft.source && (
              <div className="sm:col-span-2">
                <ReadOnlyRow label="Saved by" value={draft.source} />
              </div>
            )}
          </div>
        </details>
      </form>
    </Sheet>
  );
}
