"use client";

import { formatIsoDate, formatRelativeTime } from "@/libs/formatRelativeTime";
import type { JobApplication } from "@/libs/jobtracker/jobTrackerSchema";

import { TrashIcon } from "../icons";
import StatusBadge from "./StatusBadge";

export interface JobTrackerItemProps {
  application: JobApplication;
  now: number;
  confirming: boolean;
  deleting: boolean;
  onEdit: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}

const CELL = "py-2 pr-4 align-middle";

function Blank() {
  return <span className="text-zinc-400 dark:text-zinc-600">—</span>;
}

export default function JobTrackerItem({
  application,
  now,
  confirming,
  deleting,
  onEdit,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: JobTrackerItemProps) {
  const { company, jobTitle, location, appliedDate, matchScore, nextAction } =
    application;

  return (
    <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
      <td className={`${CELL} font-medium text-zinc-900 dark:text-zinc-50`}>
        <button
          type="button"
          onClick={onEdit}
          className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {company || "Untitled"}
        </button>
      </td>

      <td className={`${CELL} text-zinc-600 dark:text-zinc-400`}>
        {jobTitle || <Blank />}
      </td>

      <td className={`${CELL} text-zinc-600 dark:text-zinc-400`}>
        {location || <Blank />}
      </td>

      <td className={`${CELL} text-zinc-600 dark:text-zinc-400`}>
        {appliedDate ? formatIsoDate(appliedDate) : <Blank />}
      </td>

      <td className={CELL}>
        <StatusBadge status={application.status} />
      </td>

      <td
        className={`${CELL} text-right tabular-nums text-zinc-900 dark:text-zinc-50`}
      >
        {matchScore === null ? <Blank /> : `${matchScore}%`}
      </td>

      <td className={`${CELL} text-zinc-600 dark:text-zinc-400`}>
        {nextAction || <Blank />}
      </td>

      <td className={`${CELL} text-zinc-600 dark:text-zinc-400`}>
        {application.updatedAt ? (
          formatRelativeTime(application.updatedAt, now)
        ) : (
          <Blank />
        )}
      </td>

      <td className="py-2 text-right">
        {confirming ? (
          <span className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={onConfirmDelete}
            aria-label={`Delete ${company || "application"}`}
            className="rounded p-1.5 text-zinc-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
          >
            <TrashIcon className="size-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
