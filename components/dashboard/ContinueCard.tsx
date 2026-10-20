"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { formatRelativeTime } from "@/libs/formatRelativeTime";
import type { JobApplication } from "@/libs/jobtracker/jobTrackerSchema";
import { subscribeToJobApplications } from "@/libs/jobtracker/jobTrackerService";
import {
  subscribeToResumes,
  type ResumeSummary,
} from "@/libs/resume/resumeService";

import { BriefcaseIcon, FileTextIcon } from "../icons";

const ROW =
  "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900";

export default function ContinueCard() {
  const { user } = useFirebaseUser();

  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [applications, setApplications] = useState<JobApplication[] | null>(
    null,
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    return subscribeToResumes(user.uid, {
      onData: setResumes,
      // A dead card is not worth a toast — it simply does not render.
      onError: () => setResumes([]),
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    return subscribeToJobApplications(user.uid, {
      onData: setApplications,
      onError: () => setApplications([]),
    });
  }, [user]);

  // Both lists arrive sorted by updatedAt desc.
  const resume = resumes?.[0] ?? null;
  const next =
    applications?.find(
      (entry) => entry.nextAction && entry.status !== "rejected",
    ) ?? null;

  if (!resume && !next) return null;

  return (
    <section className="mb-10">
      <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Pick up where you left off
      </h2>

      <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-background p-2 dark:border-zinc-800">
        {resume && (
          <Link href={`/resume/${resume.id}`} className={ROW}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent">
              <FileTextIcon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {resume.title}
              </span>
              <span className="block truncate text-xs text-zinc-600 dark:text-zinc-400">
                {resume.updatedAt
                  ? `Edited ${formatRelativeTime(resume.updatedAt, now)}`
                  : "Your most recent resume"}
              </span>
            </span>
          </Link>
        )}

        {next && (
          <Link href="/job-tracker" className={ROW}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-alt-subtle text-accent-alt">
              <BriefcaseIcon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {next.nextAction}
              </span>
              <span className="block truncate text-xs text-zinc-600 dark:text-zinc-400">
                {next.company || "Tracked application"}
                {next.jobTitle ? ` · ${next.jobTitle}` : ""}
              </span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
