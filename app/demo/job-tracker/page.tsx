"use client";

import { useState } from "react";

import Button from "@/components/Button";
import { PlusIcon } from "@/components/icons";
import JobTrackerBoard from "@/components/job-tracker/JobTrackerBoard";
import JobTrackerList from "@/components/job-tracker/JobTrackerList";
import PageShell from "@/components/layouts/PageShell";
import ViewSwitcher from "@/components/ViewSwitcher";
import { DEMO_APPLICATIONS, DEMO_NOW } from "@/data/demoFixtures";

import DemoAvatar from "../DemoAvatar";

type TrackerView = "board" | "table";

const VIEWS: { id: TrackerView; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "table", label: "Table" },
];

const noop = () => {};

export default function DemoJobTrackerPage() {
  const [applications, setApplications] = useState(DEMO_APPLICATIONS);
  const [view, setView] = useState<TrackerView>("board");

  const shared = {
    applications,
    now: DEMO_NOW,
    confirmingId: null,
    deletingId: null,
    onEdit: noop,
    onConfirmDelete: noop,
    onDelete: noop,
  };

  return (
    <PageShell header="Job Tracker" actions={<DemoAvatar />}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Applications
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Every role you are chasing, and what you owe it next.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewSwitcher
              options={VIEWS}
              value={view}
              onChange={setView}
              label="Tracker view"
            />
            <Button icon={<PlusIcon className="size-4" />}>Add job</Button>
          </div>
        </div>

        <div className="mt-6">
          {view === "board" ? (
            <JobTrackerBoard
              {...shared}
              onStatusChange={(application, status) =>
                setApplications((current) =>
                  current.map((entry) =>
                    entry.id === application.id ? { ...entry, status } : entry,
                  ),
                )
              }
            />
          ) : (
            <JobTrackerList {...shared} />
          )}
        </div>
      </div>
    </PageShell>
  );
}
