"use client";

import { useState } from "react";

import {
  matchScore,
  type JobFacts,
  type JobMatchPayload,
} from "@/libs/insights/insightSchema";

import {
  BanknoteIcon,
  BriefcaseIcon,
  ClockIcon,
  MapPinIcon,
  SpinnerIcon,
} from "../icons";
import ViewSwitcher from "../ViewSwitcher";
import ImproveGuideline from "./ImproveGuideline";
import JobDetail from "./JobDetail";
import JobMatchAnalysis from "./JobMatchAnalysis";
import MatchScore from "./MatchScore";
import TrackJobButton from "./TrackJobButton";
import { CARD } from "./shared";

export interface JobMatchResultProps {
  result: JobMatchPayload | null;
  /** The posting `result` was matched against — read by the Job Detail view. */
  description: string;
  pending: boolean;
}

export type MatchView = "analysis" | "detail" | "improve";

const MATCH_VIEWS: { id: MatchView; label: string }[] = [
  { id: "analysis", label: "Match Analysis" },
  { id: "detail", label: "Job Detail" },
  { id: "improve", label: "How to Improve" },
];

function Fact({
  icon: Icon,
  value,
}: {
  icon: typeof MapPinIcon;
  value: string | null;
}) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
      <Icon className="size-4 shrink-0" />
      {value}
    </span>
  );
}

function JobSummary({ job }: { job: JobFacts }) {
  const described =
    job.location || job.employmentType || job.postedAt || job.salary;
  if (!job.title && !job.company && !described) return null;

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {job.title ?? "This posting"}
      </h2>

      {job.company && (
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {job.company}
        </p>
      )}

      {described && (
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Fact icon={MapPinIcon} value={job.location} />
          <Fact icon={BriefcaseIcon} value={job.employmentType} />
          <Fact icon={ClockIcon} value={job.postedAt} />
          <Fact icon={BanknoteIcon} value={job.salary} />
        </div>
      )}
    </div>
  );
}

export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${CARD} flex min-h-64 items-center justify-center text-center`}
    >
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        {children}
      </p>
    </div>
  );
}

export default function JobMatchResult({
  result,
  description,
  pending,
}: JobMatchResultProps) {
  const [view, setView] = useState<MatchView>("analysis");

  if (pending) {
    return (
      <div className="w-full">
        <Placeholder>
          <span className="inline-flex items-center gap-2">
            <SpinnerIcon className="size-4 animate-spin" />
            Reading the posting and comparing it with your resume…
          </span>
        </Placeholder>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full">
        <Placeholder>
          Paste or upload a job description, pick a resume, then run the match to
          see what this role asks for and how much of it you already evidence.
        </Placeholder>
      </div>
    );
  }

  const matched = result.items.filter((item) => item.present);
  const missing = result.items.filter((item) => !item.present);
  const score = matchScore(result.items);

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Fixed across all three views. */}
      <div className={`${CARD} flex flex-wrap items-start justify-between gap-6`}>
        <div className="flex flex-col items-start gap-3">
          <JobSummary job={result.job} />
          <TrackJobButton job={result.job} score={score.score} />
        </div>
        <div className="min-w-56 flex-1">
          <MatchScore value={score} />
        </div>
      </div>

      <ViewSwitcher
        options={MATCH_VIEWS}
        value={view}
        onChange={setView}
        label="Result views"
      />

      {view === "detail" ? (
        <JobDetail sections={result.sections} description={description} />
      ) : view === "improve" ? (
        <ImproveGuideline items={result.items} />
      ) : (
        <JobMatchAnalysis matched={matched} missing={missing} />
      )}
    </div>
  );
}
