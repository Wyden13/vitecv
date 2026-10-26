"use client";

import { useState } from "react";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import type { JobFacts } from "@/libs/insights/insightSchema";
import { createEmptyJobApplication } from "@/libs/jobtracker/jobTrackerSchema";
import { createJobApplication } from "@/libs/jobtracker/jobTrackerService";

import Button from "../Button";
import { CheckIcon, PlusIcon } from "../icons";
import { useToast } from "../Toast";

export interface TrackJobButtonProps {
  job: JobFacts;
  score: number;
}

/**
 * Carries a finished match into the job tracker. Everything it needs is
 * already on the result, so this is a pure client-side write like every other
 * Firestore mutation in the app.
 */
export default function TrackJobButton({ job, score }: TrackJobButtonProps) {
  const { user } = useFirebaseUser();
  const { notify } = useToast();

  const [saving, setSaving] = useState(false);
  const [tracked, setTracked] = useState(false);

  const track = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await createJobApplication(user.uid, {
        ...createEmptyJobApplication(),
        company: job.company ?? "",
        jobTitle: job.title ?? "",
        location: job.location ?? "",
        matchScore: score,
      });

      setTracked(true);
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
      setSaving(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="sm"
      disabled={!user || saving || tracked}
      onClick={() => void track()}
      icon={
        tracked ? (
          <CheckIcon className="size-4" />
        ) : (
          <PlusIcon className="size-4" />
        )
      }
    >
      {tracked ? "Tracked" : saving ? "Tracking…" : "Track this job"}
    </Button>
  );
}
