"use client";

import type { JobApplication } from "@/libs/jobtracker/jobTrackerSchema";

import JobTrackerItem from "./JobTrackerItem";

export interface JobTrackerListProps {
  applications: JobApplication[];
  now: number;
  confirmingId: string | null;
  deletingId: string | null;
  onEdit: (application: JobApplication) => void;
  onConfirmDelete: (id: string | null) => void;
  onDelete: (application: JobApplication) => void;
}

const HEADINGS = [
  "Company",
  "Role",
  "Location",
  "Applied",
  "Status",
  "Match",
  "Next action",
  "Updated",
];

export default function JobTrackerList({
  applications,
  now,
  confirmingId,
  deletingId,
  onEdit,
  onConfirmDelete,
  onDelete,
}: JobTrackerListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[60rem] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            {HEADINGS.map((heading) => (
              <th
                key={heading}
                className={`py-2 pr-4 font-medium text-zinc-600 dark:text-zinc-400 ${
                  heading === "Match" ? "text-right" : ""
                }`}
              >
                {heading}
              </th>
            ))}
            <th className="py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {applications.map((application) => (
            <JobTrackerItem
              key={application.id}
              application={application}
              now={now}
              confirming={confirmingId === application.id}
              deleting={deletingId === application.id}
              onEdit={() => onEdit(application)}
              onConfirmDelete={() => onConfirmDelete(application.id)}
              onCancelDelete={() => onConfirmDelete(null)}
              onDelete={() => onDelete(application)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
