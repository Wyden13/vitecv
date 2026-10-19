import {
  STATUS_LABELS,
  type JobApplicationStatus,
} from "@/libs/jobtracker/jobTrackerSchema";

const STATUS_STYLES: Record<JobApplicationStatus, string> = {
  saved: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  applied: "bg-accent-subtle text-accent",
  interview: "bg-accent-warn-subtle text-accent-warn",
  offer: "bg-accent-good-subtle text-accent-good",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export default function StatusBadge({
  status,
}: {
  status: JobApplicationStatus;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
