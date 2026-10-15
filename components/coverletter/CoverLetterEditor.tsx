"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import type {
  CoverLetterDocument,
  CoverLetterTemplateId,
} from "@/libs/coverLetterSchema";
import {
  subscribeToCoverLetter,
  updateCoverLetter,
  type CoverLetterRecord,
} from "@/libs/coverLetterService";
import { isCoverLetterEmpty, SAMPLE_COVER_LETTER } from "@/libs/sampleDocuments";
import type { DocumentTheme } from "@/libs/templateTheme";
import EditorHeader, { type EditorTab } from "../resume/EditorHeader";
import PreviewPane from "../resume/PreviewPane";
import SplitPane from "../resume/SplitPane";
import DocumentThumbnail from "../templates/DocumentThumbnail";
import StylePanel from "../templates/StylePanel";
import CoverLetterFields from "./CoverLetterFields";
import CoverLetterPreview from "./CoverLetterPreview";
import { COVER_LETTER_TEMPLATE_LIST } from "./templates/registry";

const AUTOSAVE_DELAY = 800;

interface Draft {
  title: string;
  document: CoverLetterDocument;
}

export interface CoverLetterEditorProps {
  letterId: string;
}

export default function CoverLetterEditor({
  letterId,
}: CoverLetterEditorProps) {
  const { user, loading: authLoading } = useFirebaseUser();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState<EditorTab>("editor");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set while the user is editing, so incoming snapshots (including the echo
  // of our own write) don't clobber in-flight keystrokes.
  const dirty = useRef(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCoverLetter(user.uid, letterId, {
      onData: (letter: CoverLetterRecord) => {
        setSavedAt(letter.updatedAt);
        setMissing(false);
        if (!dirty.current) {
          setDraft({ title: letter.title, document: letter.document });
        }
      },
      onMissing: () => setMissing(true),
      onError: (caught) => setError(caught.message),
    });

    return () => unsubscribe();
  }, [user, letterId]);

  const flush = useCallback(
    async (next: Draft) => {
      if (!user) return;

      setSaving(true);
      try {
        await updateCoverLetter(user.uid, letterId, {
          title: next.title,
          document: next.document,
        });
        setError(null);
        dirty.current = false;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save.");
      } finally {
        setSaving(false);
      }
    },
    [user, letterId],
  );

  const edit = useCallback(
    (next: Draft) => {
      dirty.current = true;
      setDraft(next);

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void flush(next), AUTOSAVE_DELAY);
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (authLoading || (!draft && !missing && user)) {
    return <CenteredMessage>Loading cover letter…</CenteredMessage>;
  }

  if (!user) {
    return <CenteredMessage>Sign in to edit this cover letter.</CenteredMessage>;
  }

  if (missing) {
    return <CenteredMessage>This cover letter no longer exists.</CenteredMessage>;
  }

  if (!draft) return null;

  const { document } = draft;

  const changeDocument = (next: CoverLetterDocument) =>
    edit({ ...draft, document: next });

  const thumbnailSource = isCoverLetterEmpty(document)
    ? { ...SAMPLE_COVER_LETTER, theme: document.theme }
    : document;

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        title={draft.title}
        onTitleChange={(title) => edit({ ...draft, title })}
        activeTab={tab}
        onTabChange={setTab}
        backHref="/cv"
        backLabel="Cover letters"
        titleLabel="Cover letter title"
        saving={saving}
        savedAt={savedAt}
        error={error}
      />

      <SplitPane
        storageKey="vitecv:cover-letter-split"
        label="Resize editor and preview"
        primary={
          tab === "editor" ? (
            <CoverLetterFields document={document} onChange={changeDocument} />
          ) : (
            <StylePanel
              templates={COVER_LETTER_TEMPLATE_LIST}
              templateId={document.templateId}
              theme={document.theme}
              onTemplateChange={(templateId: CoverLetterTemplateId) =>
                changeDocument({ ...document, templateId })
              }
              onThemeChange={(theme: DocumentTheme) =>
                changeDocument({ ...document, theme })
              }
              galleryHref="/cv/templates"
              renderThumbnail={(id) => (
                <DocumentThumbnail>
                  <CoverLetterPreview
                    document={{ ...thumbnailSource, templateId: id }}
                  />
                </DocumentThumbnail>
              )}
            />
          )
        }
        secondary={
          <PreviewPane>
            <CoverLetterPreview document={document} />
          </PreviewPane>
        }
      />
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
    </div>
  );
}
