"use client";

import { useEffect, useState } from "react";

import Button from "@/components/Button";
import Sheet from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import {
  importLibraryFromResume,
  type LibraryImportResult,
} from "@/libs/library/libraryService";
import type { LibrarySectionMeta } from "@/libs/library/librarySchema";
import {
  getResume,
  subscribeToResumes,
  type ResumeSummary,
} from "@/libs/resume/resumeService";
import Message from "./Message";

export interface ImportFromResumeSheetProps {
  open: boolean;
  /** The user's custom sections, so the import can reuse them. */
  sections: LibrarySectionMeta[];
  onClose: () => void;
}

export default function ImportFromResumeSheet({
  open,
  sections,
  onClose,
}: ImportFromResumeSheetProps) {
  const { user, loading: authLoading } = useFirebaseUser();
  const { notify } = useToast();

  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Gated on `open` so the drawer holds no listener while it is shut.
  useEffect(() => {
    if (!user || !open) return;

    const unsubscribe = subscribeToResumes(user.uid, {
      onData: (next) => {
        setResumes(next);
        setError(null);
      },
      onError: (caught) => setError(caught.message),
    });

    return () => unsubscribe();
  }, [user, open]);

  const describe = (result: LibraryImportResult, title: string): string => {
    if (!result.items) return `Nothing to import from ${title}.`;

    const items = `${result.items} item${result.items === 1 ? "" : "s"}`;
    const added = result.sections
      ? ` and ${result.sections} new section${result.sections === 1 ? "" : "s"}`
      : "";

    return `Imported ${items}${added} from ${title}.`;
  };

  const handleImport = async (resume: ResumeSummary) => {
    if (!user) return;

    setImporting(true);
    try {
      const record = await getResume(user.uid, resume.id);
      if (!record) {
        notify({ variant: "error", message: "That resume no longer exists." });
        return;
      }

      const result = await importLibraryFromResume(user.uid, record.document, {
        sections,
      });

      notify({ variant: "success", message: describe(result, record.title) });
      onClose();
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not import that resume.",
      });
    } finally {
      setImporting(false);
    }
  };

  const selected = resumes?.find((resume) => resume.id === selectedId) ?? null;

  return (
    <Sheet
      open={open}
      title="Import from a resume"
      description="Copies a resume's details into your library. Existing items stay put — imported ones are added after them."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selected || importing}
            onClick={() => selected && void handleImport(selected)}
          >
            {importing ? "Importing…" : "Import"}
          </Button>
        </>
      }
    >
      {authLoading || (user && resumes === null && !error) ? (
        <Message>Loading your resumes…</Message>
      ) : !user ? (
        <Message>Sign in to import a resume.</Message>
      ) : error ? (
        <Message tone="error">Could not load your resumes: {error}</Message>
      ) : !resumes || resumes.length === 0 ? (
        <Message>
          No resumes yet. Upload one from the Resume Builder first.
        </Message>
      ) : (
        <ul className="flex flex-col gap-2">
          {resumes.map((resume) => {
            const active = resume.id === selectedId;

            return (
              <li key={resume.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(resume.id)}
                  aria-pressed={active}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-accent-border bg-accent-subtle"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span
                    className={`block truncate text-sm font-medium ${
                      active ? "text-accent" : "text-zinc-900 dark:text-zinc-50"
                    }`}
                  >
                    {resume.title}
                  </span>
                  {resume.fileName && (
                    <span className="mt-0.5 block truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {resume.fileName}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
