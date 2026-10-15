"use client";

import { formatRelativeTime } from "@/libs/formatRelativeTime";
import type { ResumeSummary } from "@/libs/resume/resumeService";

/**
 * Which resume is being analysed.
 *
 * A native select rather than a custom menu: it is one choice from a short
 * list, and the platform control already handles keyboard, touch and screen
 * readers better than anything hand-rolled here would.
 */

export interface ResumePickerProps {
  resumes: ResumeSummary[];
  value: string | null;
  onChange: (resumeId: string) => void;
  now: number;
}

export default function ResumePicker({
  resumes,
  value,
  onChange,
  now,
}: ResumePickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="insights-resume"
        className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
      >
        Resume
      </label>
      <select
        id="insights-resume"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full max-w-sm rounded-md border border-zinc-200 bg-background px-2.5 py-1.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-100"
      >
        {resumes.map((resume) => (
          <option key={resume.id} value={resume.id}>
            {resume.title}
            {resume.updatedAt
              ? ` — edited ${formatRelativeTime(resume.updatedAt, now)}`
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
