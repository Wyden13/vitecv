"use client";

import { useEffect, useState } from "react";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import type { JobFacts } from "@/libs/insights/insightSchema";
import {
  DEFAULT_JOB_STATUS,
  createEmptyJobApplication,
  type JobApplication,
} from "@/libs/jobtracker/jobTrackerSchema";
import {
  createJobApplication,
  deleteJobApplication,
  subscribeToJobApplications,
} from "@/libs/jobtracker/jobTrackerService";

import Button from "../Button";
import { CheckIcon, PlusIcon, XIcon } from "../icons";
import { useToast } from "../Toast";

export interface TrackJobButtonProps {
  job: JobFacts;
  score: number;
}

function key(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * `JobFacts` carries no URL, so unlike the browser extension — which dedupes
 * on `canonicalJobUrl` — the only identity available here is company + title.
 *
 * A record saved by the extension for the same role therefore reads as
 * tracked, and untracking would delete it along with its url, description and
 * any status the user set. That is what `hasEdits` below guards.
 */
function findTracked(
  applications: JobApplication[],
  job: JobFacts,
): JobApplication | undefined {
  const company = key(job.company);
  const title = key(job.title);

  // With nothing to match on, every blank record would look like this job.
  if (!company && !title) return undefined;

  return applications.find(
    (application) =>
      key(application.company) === company &&
      key(application.jobTitle) === title,
  );
}

/** Anything the user could lose by untracking. */
function hasEdits(application: JobApplication): boolean {
  return (
    application.status !== DEFAULT_JOB_STATUS ||
    application.nextAction.trim() !== "" ||
    application.appliedDate !== null
  );
}

/**
 * Carries a finished match into the job tracker, and back out again.
 *
 * Tracked state is read from Firestore rather than held locally, so it
 * survives a remount — re-running the same match shows "Tracked" instead of
 * silently creating a duplicate — and follows along when the record is
 * deleted from the Job Tracker page.
 */
export default function TrackJobButton({ job, score }: TrackJobButtonProps) {
  const { user } = useFirebaseUser();
  const { notify } = useToast();
  const [applications, setApplications] = useState<JobApplication[] | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  // Keyed by document id, not a boolean: if the record is deleted and the
  // job tracked afresh, the new id will not match and the confirm step
  // cannot resurface against a different record.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!user) return;

    return subscribeToJobApplications(user.uid, {
      onData: setApplications,
      onError: () => setApplications([]),
    });
  }, [user]);

  const tracked = applications ? findTracked(applications, job) : undefined;
  const confirming = Boolean(tracked && confirmingId === tracked.id);

  const track = async () => {
    if (!user) return;

    setBusy(true);
    try {
      await createJobApplication(user.uid, {
        ...createEmptyJobApplication(),
        company: job.company ?? "",
        jobTitle: job.title ?? "",
        location: job.location ?? "",
        matchScore: score,
      });

      notify({
        variant: "success",
        message: `Tracking ${job.title ?? "this role"}`,
      });
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not track this job.",
      });
    } finally {
      setBusy(false);
    }
  };

  const untrack = async () => {
    if (!user || !tracked) return;

    setBusy(true);
    try {
      await deleteJobApplication(user.uid, tracked.id);

      setConfirmingId(null);
      notify({
        variant: "success",
        message: `Removed ${job.title ?? "this role"} from your tracker`,
      });
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not untrack this job.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Deleting a record the user has worked on is worth a second click. A fresh
  // one carries nothing but what this button just wrote, so it goes quietly.
  const handleTrackedClick = () => {
    if (tracked && hasEdits(tracked) && !confirming) {
      setConfirmingId(tracked.id);
      return;
    }
    void untrack();
  };

  if (confirming && tracked) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void untrack()}
          disabled={busy}
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
        >
          {busy ? "Untracking…" : "Untrack"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmingId(null)}
          className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (tracked) {
    const undo = hovering && !busy;

    return (
      <Button
        variant="soft"
        size="sm"
        aria-label="Untrack this job"
        disabled={busy}
        onClick={handleTrackedClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        icon={
          undo ? <XIcon className="size-4" /> : <CheckIcon className="size-4" />
        }
      >
        {busy ? "Untracking…" : undo ? "Untrack" : "Tracked"}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      disabled={!user || applications === null || busy}
      onClick={() => void track()}
      icon={<PlusIcon className="size-4" />}
    >
      {busy ? "Tracking…" : "Track this job"}
    </Button>
  );
}
