"use client";

import Button from "@/components/Button";
import JobMatchResult from "@/components/job-match/JobMatchResult";
import PageShell from "@/components/layouts/PageShell";
import { TextAreaField } from "@/components/resume/fields/Field";
import { DEMO_MATCH, DEMO_MATCH_DESCRIPTION } from "@/data/demoFixtures";

import DemoAvatar from "../DemoAvatar";

export default function DemoJobMatchPage() {
  return (
    <PageShell header="Job Match" actions={<DemoAvatar />}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-zinc-200 bg-background p-4 lg:w-1/3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Analyse a Job
            </h2>
            <TextAreaField
              label="Job Description"
              value={DEMO_MATCH_DESCRIPTION}
              onChange={() => {}}
              rows={10}
            />
            <Button className="self-start">Match again</Button>
          </div>

          <div className="min-w-0 flex-1">
            <JobMatchResult
              result={DEMO_MATCH}
              description={DEMO_MATCH_DESCRIPTION}
              pending={false}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
