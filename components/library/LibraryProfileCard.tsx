"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import {
  saveLibraryProfile,
  subscribeToLibraryProfile,
} from "@/libs/library/libraryService";
import type { ResumeProfile } from "@/libs/resume/resumeSchema";
import ProfileFields from "../resume/fields/ProfileFields";
import Message from "./Message";

const AUTOSAVE_DELAY = 800;

/**
 * The profile is a single record, so it edits in place and autosaves rather
 * than going through the drawer. Owning its own subscription keeps the profile
 * document out of `LibraryView`, which already tracks sections and items.
 */
export default function LibraryProfileCard() {
  const { user, loading: authLoading } = useFirebaseUser();

  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set while the user is typing, so an inbound snapshot cannot overwrite a
  // keystroke that has not been written yet — the ResumeEditor guard.
  const dirty = useRef(false);
  const pending = useRef<ResumeProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToLibraryProfile(user.uid, {
      onData: (next) => {
        setError(null);
        if (!dirty.current) setProfile(next);
      },
      onError: (caught) => setError(caught.message),
    });

    return () => unsubscribe();
  }, [user]);

  const flush = useCallback(
    async (next: ResumeProfile) => {
      if (!user) return;

      setSaving(true);
      try {
        await saveLibraryProfile(user.uid, next);
        dirty.current = false;
        setSaved(true);
        setError(null);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not save your profile.",
        );
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  // Navigating away mid-edit should not drop the last keystrokes. The write is
  // queued locally by the Firestore SDK, so firing it unawaited is enough.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (dirty.current && pending.current) {
        void flushRef.current(pending.current);
      }
    },
    [],
  );

  const edit = useCallback(
    (next: ResumeProfile) => {
      dirty.current = true;
      pending.current = next;
      setSaved(false);
      setProfile(next);

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void flush(next), AUTOSAVE_DELAY);
    },
    [flush],
  );

  if (authLoading || (user && profile === null && !error)) {
    return <Message>Loading your profile…</Message>;
  }

  if (!user) return <Message>Sign in to edit your profile.</Message>;

  if (error && !profile) {
    return <Message tone="error">Could not load your profile: {error}</Message>;
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-3">
      <ProfileFields value={profile} onChange={edit} />

      <p
        aria-live="polite"
        className={`text-xs ${
          error
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {error
          ? error
          : saving
            ? "Saving…"
            : saved
              ? "Saved"
              : "Changes save automatically."}
      </p>
    </div>
  );
}
