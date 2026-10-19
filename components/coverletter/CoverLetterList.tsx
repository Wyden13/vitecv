"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import {
  deleteCoverLetter,
  subscribeToCoverLetters,
  type CoverLetterSummary,
} from "@/libs/coverletter/coverLetterService";
import { formatRelativeTime } from "@/libs/formatRelativeTime";
import { ChevronDownIcon, FileTextIcon, TrashIcon } from "../icons";
import { useToast } from "../Toast";

export default function CoverLetterList() {
  const { user, loading: authLoading } = useFirebaseUser();
  const { notify } = useToast();

  const [letters, setLetters] = useState<CoverLetterSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCoverLetters(user.uid, {
      onData: (next) => {
        setLetters(next);
        setError(null);
      },
      onError: (caught) => setError(caught.message),
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (letter: CoverLetterSummary) => {
    if (!user) return;

    setDeletingId(letter.id);
    try {
      await deleteCoverLetter(user.uid, letter.id);
      notify({ variant: "success", message: `Deleted ${letter.title}` });
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not delete cover letter.",
      });
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  if (authLoading || (user && letters === null && !error)) {
    return <Message>Loading your cover letters…</Message>;
  }

  if (!user) return <Message>Sign in to see your cover letters.</Message>;

  if (error) {
    return (
      <Message tone="error">Could not load your cover letters: {error}</Message>
    );
  }

  if (!letters || letters.length === 0) {
    return (
      <Message>No cover letters yet — create one above to get started.</Message>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {letters.map((letter) => {
        const confirming = confirmingId === letter.id;

        return (
          <li
            key={letter.id}
            className="relative flex items-center gap-3 py-3 pr-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <span className="shrink-0 pl-2 text-zinc-400 dark:text-zinc-500">
              <FileTextIcon className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              {/* ::after overlay keeps the delete button out of the anchor. */}
              <Link
                href={`/cv/${letter.id}`}
                className="text-sm font-medium text-zinc-900 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-100"
              >
                {letter.title}
              </Link>
              <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                {letter.updatedAt
                  ? `edited ${formatRelativeTime(letter.updatedAt, now)}`
                  : "not saved yet"}
              </p>
            </div>

            {confirming ? (
              <div className="relative z-10 flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => void handleDelete(letter)}
                  disabled={deletingId === letter.id}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {deletingId === letter.id ? "Deleting…" : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmingId(letter.id)}
                  aria-label={`Delete ${letter.title}`}
                  className="relative z-10 shrink-0 rounded p-1.5 text-zinc-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                >
                  <TrashIcon className="size-4" />
                </button>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 -rotate-90 text-zinc-300 dark:text-zinc-600"
                />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Message({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <p
      className={`mt-3 text-sm ${
        tone === "error"
          ? "text-red-600 dark:text-red-400"
          : "text-zinc-600 dark:text-zinc-400"
      }`}
    >
      {children}
    </p>
  );
}
