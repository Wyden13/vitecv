"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { analyzeResume, analyzeRoleGap } from "@/actions/insights-action";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { formatRelativeTime } from "@/libs/formatRelativeTime";
import { hashText, type Keyword, type ResumeAnalysis, type RoleGap as RoleGapResult } from "@/libs/insights/insightSchema";
import {
  saveAnalysis,
  saveRoleGap,
  subscribeToAnalysis,
  subscribeToRoleGap,
} from "@/libs/insights/insightsService";
import {
  blockIndex,
  blocksFromResume,
  serializeBlocks,
} from "@/libs/insights/resumeText";
import {
  subscribeToResume,
  subscribeToResumes,
  type ResumeRecord,
  type ResumeSummary,
} from "@/libs/resume/resumeService";
import Button from "../Button";
import { SpinnerIcon } from "../icons";
import { useToast } from "../Toast";
import EvidencePanel from "./EvidencePanel";
import KeywordViews, {
  KEYWORD_VIEWS,
  type KeywordView,
} from "./KeywordViews";
import ResumePicker from "./ResumePicker";
import RoleGap from "./RoleGap";
import SignalCards from "./SignalCards";

/**
 * The Insights page: pick a resume, read its cached analysis, re-run when it
 * drifts.
 *
 * Nothing calls GLM on its own. A stored analysis renders instantly, and a
 * request only leaves on a click, because every one of them costs money — an
 * auto-analysing page would bill the user for navigating.
 *
 * Staleness is surfaced rather than hidden: the hash of the text we would send
 * is compared against the hash stored with the analysis, so an edited resume
 * says "out of date" instead of quietly presenting old numbers as current.
 */

/** Data tagged with the resume it was loaded for. */
type Keyed<T> = { id: string; value: T } | null;

function forResume<T>(state: Keyed<T>, resumeId: string | null): T | null {
  return state && state.id === resumeId ? state.value : null;
}

function Section({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function InsightsPanel() {
  const { user, loading: authLoading } = useFirebaseUser();
  const { notify } = useToast();

  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Each subscription's result is tagged with the resume it belongs to and read
  // only when that still matches the selection. Clearing these from an effect
  // body instead would cascade renders, and until the clear landed the previous
  // resume's analysis would be on screen under the new resume's name.
  const [resumeState, setResumeState] = useState<Keyed<ResumeRecord | null>>(null);
  const [analysisState, setAnalysisState] = useState<Keyed<ResumeAnalysis | null>>(null);
  const [gapState, setGapState] = useState<Keyed<RoleGapResult | null>>(null);

  const resume = forResume(resumeState, resumeId);
  const analysis = forResume(analysisState, resumeId);
  const gap = forResume(gapState, resumeId);

  const [view, setView] = useState<KeywordView>("cloud");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [pending, setPending] = useState<"analysis" | "gap" | null>(null);

  const [now, setNow] = useState(() => Date.now());

  // Same approach as ResumeList: a ticking value ages "just now" into
  // "2 minutes ago" without needing a navigation.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    return subscribeToResumes(user.uid, {
      onData: (next) => {
        setResumes(next);
        // Default to the newest edit, and recover if the selection is deleted.
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
      onData: (record) => setResumeState({ id: resumeId, value: record }),
      onMissing: () => setResumeState({ id: resumeId, value: null }),
      onError: (caught) =>
        notify({ variant: "error", message: caught.message }),
    });
  }, [user, resumeId, notify]);

  const blocks = useMemo(
    () => (resume ? blocksFromResume(resume) : []),
    [resume],
  );
  const blockMap = useMemo(() => blockIndex(blocks), [blocks]);
  const sourceHash = useMemo(
    () => hashText(serializeBlocks(blocks)),
    [blocks],
  );

  // Read by the analysis subscription when a snapshot lands, so stored
  // citations are always filtered against the resume as it is now.
  const blockIdsRef = useRef<string[]>([]);
  useEffect(() => {
    blockIdsRef.current = blocks.map((block) => block.id);
  }, [blocks]);

  // `sourceHash` is a dependency on purpose: the analysis document can arrive
  // before the resume document, and citations filtered against an empty block
  // set would leave the evidence panel blank for the rest of the session.
  // Re-subscribing when the text changes re-normalizes against the real ids.
  useEffect(() => {
    if (!user || !resumeId) return;

    return subscribeToAnalysis(
      user.uid,
      resumeId,
      () => blockIdsRef.current,
      {
        onData: (value) => setAnalysisState({ id: resumeId, value }),
        onError: (caught) =>
          notify({ variant: "error", message: caught.message }),
      },
    );
  }, [user, resumeId, notify, sourceHash]);

  useEffect(() => {
    if (!user || !resumeId) return;

    return subscribeToRoleGap(user.uid, resumeId, {
      onData: (value) => setGapState({ id: resumeId, value }),
      onError: (caught) =>
        notify({ variant: "error", message: caught.message }),
    });
  }, [user, resumeId, notify]);

  const runAnalysis = useCallback(async () => {
    if (!user || !resumeId || blocks.length === 0) return;

    setPending("analysis");
    try {
      const result = await analyzeResume(blocks);
      await saveAnalysis(user.uid, resumeId, { ...result, sourceHash });
      notify({ variant: "success", message: "Analysis updated" });
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error ? caught.message : "Could not analyse this resume.",
      });
    } finally {
      setPending(null);
    }
  }, [user, resumeId, blocks, sourceHash, notify]);

  const runGap = useCallback(
    async (role: string) => {
      if (!user || !resumeId || blocks.length === 0) return;

      setPending("gap");
      try {
        const result = await analyzeRoleGap(blocks, role);
        await saveRoleGap(user.uid, resumeId, {
          ...result,
          role: role.trim(),
          sourceHash,
        });
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error ? caught.message : "Could not compare roles.",
        });
      } finally {
        setPending(null);
      }
    },
    [user, resumeId, blocks, sourceHash, notify],
  );

  if (authLoading || resumes === null) {
    return <Message>Loading your resumes…</Message>;
  }

  if (!user) return <Message>Sign in to analyse a resume.</Message>;

  if (resumes.length === 0) {
    return (
      <Message>
        No resumes yet — upload or build one first, then come back here.
      </Message>
    );
  }

  const analysing = pending === "analysis";
  const stale = Boolean(analysis) && analysis?.sourceHash !== sourceHash;
  const empty = blocks.filter((block) => block.kind !== "profile").length === 0;
  const selected: Keyword | null =
    analysis?.keywords.find((keyword) => keyword.term === selectedTerm) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Keyword analysis"
        description="What this resume emphasises, weighted by how prominently it appears and grouped by the kind of thing it is."
        actions={
          <div className="flex items-center gap-3">
            {analysis?.createdAt && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatRelativeTime(analysis.createdAt, now)} · {analysis.model}
              </span>
            )}
            <Button
              size="sm"
              disabled={analysing || empty}
              icon={
                analysing ? (
                  <SpinnerIcon className="size-4 animate-spin" />
                ) : undefined
              }
              onClick={() => void runAnalysis()}
            >
              {analysing ? "Analysing…" : analysis ? "Re-analyse" : "Analyse"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <ResumePicker
            resumes={resumes}
            value={resumeId}
            onChange={setResumeId}
            now={now}
          />

          {empty && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This resume has no content to analyse yet.
            </p>
          )}

          {stale && (
            <p className="rounded-lg border border-accent-border bg-accent-subtle px-3 py-2 text-sm text-accent">
              This resume changed after the last analysis. Re-analyse to bring
              the keywords up to date.
            </p>
          )}

          {analysis && (
            // Held at reduced opacity while re-running rather than replaced by a
            // skeleton: no layout jump, and the old numbers stay readable.
            <div
              className={`flex flex-col gap-5 transition-opacity ${
                analysing ? "opacity-50" : ""
              }`}
            >
              <SignalCards
                keywords={analysis.keywords}
                signals={analysis.signals}
                blocks={blockMap}
              />

              <div className="flex flex-wrap gap-1.5">
                {KEYWORD_VIEWS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setView(option.id)}
                    aria-pressed={view === option.id}
                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      view === option.id
                        ? "border-accent bg-accent-subtle text-accent"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
                <KeywordViews
                  keywords={analysis.keywords}
                  view={view}
                  blocks={blockMap}
                  selectedTerm={selectedTerm}
                  onSelect={(keyword) =>
                    setSelectedTerm((current) =>
                      current === keyword.term ? null : keyword.term,
                    )
                  }
                />

                <div className="lg:border-l lg:border-zinc-200 lg:pl-5 lg:dark:border-zinc-800">
                  <EvidencePanel keyword={selected} blocks={blockMap} />
                </div>
              </div>
            </div>
          )}

          {!analysis && !empty && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Nothing analysed yet. Run an analysis to see this resume&apos;s
              keywords, weights and categories.
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Role gap"
        description="Compare this resume against a role you are targeting, and see what it expects that you have not evidenced."
      >
        {gap && gap.sourceHash !== sourceHash && (
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            This comparison ran against an earlier version of the resume.
          </p>
        )}

        {/* Keyed so switching resumes resets the role field, which is seeded
            from the stored gap on mount. */}
        <RoleGap
          key={resumeId}
          gap={gap}
          pending={pending === "gap"}
          onRun={(role) => void runGap(role)}
        />
      </Section>
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
  );
}
