"use client";

import { useState, type DragEvent } from "react";

import { formatRelativeTime } from "@/libs/formatRelativeTime";
import {
  JOB_STATUSES,
  STATUS_LABELS,
  type JobApplication,
  type JobApplicationStatus,
} from "@/libs/jobtracker/jobTrackerSchema";

import { TrashIcon } from "../icons";

export interface JobTrackerBoardProps {
  applications: JobApplication[];
  now: number;
  confirmingId: string | null;
  deletingId: string | null;
  onEdit: (application: JobApplication) => void;
  onConfirmDelete: (id: string | null) => void;
  onStatusChange: (
    application: JobApplication,
    status: JobApplicationStatus,
  ) => void;
  onDelete: (application: JobApplication) => void;
}

function Card({
  application,
  now,
  confirming,
  deleting,
  dragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onConfirmDelete,
  onCancelDelete,
  onStatusChange,
  onDelete,
}: {
  application: JobApplication;
  now: number;
  confirming: boolean;
  deleting: boolean;
  dragging: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onStatusChange: (status: JobApplicationStatus) => void;
  onDelete: () => void;
}) {
  const { company, jobTitle, location, matchScore, nextAction } = application;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex cursor-grab flex-col gap-2 rounded-lg border border-zinc-200 bg-background p-3 transition-opacity active:cursor-grabbing dark:border-zinc-800 ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          draggable={false}
          onClick={onEdit}
          className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <p className="truncate text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            {company || "Untitled"}
          </p>
          <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
            {jobTitle || "No role yet"}
            {location ? ` · ${location}` : ""}
          </p>
        </button>

        {matchScore !== null && (
          <span className="shrink-0 text-sm font-bold tabular-nums text-accent">
            {matchScore}%
          </span>
        )}
      </div>

      {nextAction && (
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
          Next: {nextAction}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <select
          draggable={false}
          value={application.status}
          onChange={(event) =>
            onStatusChange(event.target.value as JobApplicationStatus)
          }
          aria-label={`Status for ${company || "application"}`}
          className="rounded-md border border-zinc-200 bg-background px-1.5 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent dark:border-zinc-800 dark:text-zinc-50"
        >
          {JOB_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        {confirming ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              draggable={false}
              onClick={onDelete}
              disabled={deleting}
              className="rounded px-1.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              draggable={false}
              onClick={onCancelDelete}
              className="rounded px-1.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            draggable={false}
            onClick={onConfirmDelete}
            aria-label={`Delete ${company || "application"}`}
            className="rounded p-1 text-zinc-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
          >
            <TrashIcon className="size-4" />
          </button>
        )}
      </div>

      {application.updatedAt && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {formatRelativeTime(application.updatedAt, now)}
        </p>
      )}
    </div>
  );
}

export default function JobTrackerBoard({
  applications,
  now,
  confirmingId,
  deletingId,
  onEdit,
  onConfirmDelete,
  onStatusChange,
  onDelete,
}: JobTrackerBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<JobApplicationStatus | null>(
    null,
  );

  const draggingStatus =
    applications.find((entry) => entry.id === draggingId)?.status ?? null;

  const clearDrag = () => {
    setDraggingId(null);
    setDropStatus(null);
  };

  const handleDrop =
    (status: JobApplicationStatus) => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const id = event.dataTransfer.getData("text/plain");
      const application = applications.find((entry) => entry.id === id);

      if (application && application.status !== status) {
        onStatusChange(application, status);
      }

      clearDrag();
    };

  return (
    <div className="flex gap-3 overflow-x-auto p-2 pb-8">
      {JOB_STATUSES.map((status) => {
        const column = applications.filter((entry) => entry.status === status);
        const isTarget =
          dropStatus === status &&
          draggingStatus !== null &&
          draggingStatus !== status;

        return (
          <div
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropStatus(status);
            }}
            onDragLeave={(event) => {
              if (
                !event.currentTarget.contains(event.relatedTarget as Node | null)
              ) {
                setDropStatus((current) =>
                  current === status ? null : current,
                );
              }
            }}
            onDrop={handleDrop(status)}
            className={`flex min-h-32 w-64 shrink-0 flex-col gap-2 rounded-lg bg-zinc-100 p-2 transition-shadow dark:bg-zinc-800 ${
              isTarget ? "ring-2 ring-accent" : ""
            }`}
          >
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              {STATUS_LABELS[status]}{" "}
              <span className="font-normal normal-case tracking-normal tabular-nums">
                ({column.length})
              </span>
            </h3>

            {column.length === 0 ? (
              <p className="px-1 pb-2 text-xs text-zinc-500 dark:text-zinc-400">
                Nothing here yet.
              </p>
            ) : (
              column.map((application) => (
                <Card
                  key={application.id}
                  application={application}
                  now={now}
                  confirming={confirmingId === application.id}
                  deleting={deletingId === application.id}
                  dragging={draggingId === application.id}
                  onDragStart={(event) => {
                    if (
                      (event.target as HTMLElement).closest(
                        "button, select, input",
                      )
                    ) {
                      event.preventDefault();
                      return;
                    }

                    setDraggingId(application.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", application.id);
                  }}
                  onDragEnd={clearDrag}
                  onEdit={() => onEdit(application)}
                  onConfirmDelete={() => onConfirmDelete(application.id)}
                  onCancelDelete={() => onConfirmDelete(null)}
                  onStatusChange={(next) => onStatusChange(application, next)}
                  onDelete={() => onDelete(application)}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
