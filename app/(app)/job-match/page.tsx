"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { matchJob } from "@/actions/insights-action";
import Button from "@/components/Button";
import { SpinnerIcon } from "@/components/icons";
import JobDescriptionUpload from "@/components/job-match/JobDescriptionUpload";
import JobMatchResult from "@/components/job-match/JobMatchResult";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";
import ResumePicker from "@/components/insights/ResumePicker";
import { TextAreaField } from "@/components/resume/fields/Field";
import { useToast } from "@/components/Toast";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { takeHandoff } from "@/libs/handoff";
import { hashText, type JobMatchPayload } from "@/libs/insights/insightSchema";
import {
  readJobMatch,
  saveJobMatch,
} from "@/libs/insights/insightsService";
import { blocksFromResume, serializeBlocks } from "@/libs/insights/resumeText";
import {
  subscribeToResume,
  subscribeToResumes,
  type ResumeRecord,
  type ResumeSummary,
} from "@/libs/resume/resumeService";

/**
 * Tagged with the resume it came from, so a result can never outlive the pick
 * it was run against — see `forResume`.
 */
type Keyed<T> = { id: string; value: T } | null;

function forResume<T>(state: Keyed<T>, resumeId: string | null): T | null {
  return state && state.id === resumeId ? state.value : null;
}

export default function JobMatchPage() {
  const { user } = useFirebaseUser();
  const { notify } = useToast();

  // Seeded from the dashboard composer when it routed a pasted posting here.
  // Read in the initialiser rather than an effect — see `libs/handoff.ts`.
  const [description, setDescription] = useState(
    () => takeHandoff()?.jobDescription ?? "",
  );

  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeState, setResumeState] = useState<Keyed<ResumeRecord | null>>(null);
  /**
   * The posting travels with the payload: the textarea stays editable after a
   * match, and the Job Detail view must show the text the result was computed
   * from, not whatever is in the box now.
   */
  const [resultState, setResultState] =
    useState<Keyed<{ payload: JobMatchPayload; description: string }>>(null);
  const [pending, setPending] = useState(false);

  const resume = forResume(resumeState, resumeId);
  const matched = forResume(resultState, resumeId);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    return subscribeToResumes(user.uid, {
      onData: (next) => {
        setResumes(next);
        setResumeId((current) =>
          current && next.some((entry) => entry.id === current)
            ? current
            : (next[0]?.id ?? null),
        );
      },
      onError: (caught) =>
        notify({ variant: "error", message: caught.message }),
    });
  }, [user, notify]);

  useEffect(() => {
    if (!user || !resumeId) return;

    return subscribeToResume(user.uid, resumeId, {
      onData: (next) => setResumeState({ id: resumeId, value: next }),
      onMissing: () => setResumeState({ id: resumeId, value: null }),
      onError: (caught) =>
        notify({ variant: "error", message: caught.message }),
    });
  }, [user, resumeId, notify]);

  const blocks = useMemo(
    () => (resume ? blocksFromResume(resume) : []),
    [resume],
  );

  /** `TextAreaField` unwraps the event itself, so this receives the text. */
  const handleChange = (next: string) => {
    setDescription(next);
  };

  const runMatch = useCallback(async () => {
    if (!user || !resumeId || blocks.length === 0 || !description.trim()) return;

    setPending(true);
    try {
      const posting = description.trim();
      const key = hashText(`${serializeBlocks(blocks)}\u0000${posting}`);
      const cached = await readJobMatch(user.uid, resumeId, key);
      if (cached) {
        setResultState({
          id: resumeId,
          value: { payload: cached, description: posting },
        });
        return;
      }
      const next = await matchJob(blocks, description);
      setResultState({
        id: resumeId,
        value: { payload: next, description: posting },
      });
      await saveJobMatch(user.uid, resumeId, key, next).catch(() => {});
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not match this job.",
      });
    } finally {
      setPending(false);
    }
  }, [user, resumeId, blocks, description, notify]);

  const ready = Boolean(resumeId) && blocks.length > 0;

  return (
    <PageShell header="Job Match" actions={<UserMenu />}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start gap-6">
          {/*Analyse a job*/}
          <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-zinc-200 bg-background p-4 lg:w-1/3 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Analyse a Job
            </h2>

            <TextAreaField
              label="Job Description"
              value={description}
              onChange={handleChange}
              placeholder="Paste a job description here."
              rows={10}
            />

            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              or Upload
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <JobDescriptionUpload onText={setDescription} disabled={pending} />

            {resumes && resumes.length > 0 ? (
              <ResumePicker
                resumes={resumes}
                value={resumeId}
                onChange={setResumeId}
                now={now}
              />
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Add a resume first — the match compares this posting against one
                of yours.
              </p>
            )}

            <Button
              className="self-start"
              disabled={pending || !ready || !description.trim()}
              onClick={() => void runMatch()}
              icon={
                pending ? (
                  <SpinnerIcon className="size-4 animate-spin" />
                ) : undefined
              }
            >
              {pending ? "Matching…" : matched ? "Match again" : "Match"}
            </Button>
          </div>

          {/*Job Result*/}
          <div className="min-w-0 flex-1">
            <JobMatchResult
              key={resumeId}
              result={matched?.payload ?? null}
              description={matched?.description ?? ""}
              pending={pending}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
