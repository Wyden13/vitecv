"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import {
  subscribeToResume,
  updateResume,
  type ResumeRecord,
} from "@/libs/resume/resumeService";
import type { ResumeDocument, ResumeTemplateId } from "@/libs/resume/resumeSchema";
import { isResumeEmpty, SAMPLE_RESUME } from "@/libs/sampleDocuments";
import type { DocumentTheme } from "@/libs/templateTheme";
import DocumentThumbnail from "../templates/DocumentThumbnail";
import StylePanel from "../templates/StylePanel";
import EditorHeader, { type EditorTab } from "./EditorHeader";
import PreviewPane from "./PreviewPane";
import ResumePreview from "./ResumePreview";
import SectionList from "./SectionList";
import SplitPane from "./SplitPane";
import { RESUME_TEMPLATE_LIST } from "./templates/registry";

const AUTOSAVE_DELAY = 800;

interface Draft {
  title: string;
  document: ResumeDocument;
}

export interface ResumeEditorProps {
  resumeId: string;
}

export default function ResumeEditor({ resumeId }: ResumeEditorProps) {
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

    const unsubscribe = subscribeToResume(user.uid, resumeId, {
      onData: (resume: ResumeRecord) => {
        setSavedAt(resume.updatedAt);
        setMissing(false);
        if (!dirty.current) {
          setDraft({ title: resume.title, document: resume.document });
        }
      },
      onMissing: () => setMissing(true),
      onError: (caught) => setError(caught.message),
    });

    return () => unsubscribe();
  }, [user, resumeId]);

  const flush = useCallback(
    async (next: Draft) => {
      if (!user) return;

      setSaving(true);
      try {
        await updateResume(user.uid, resumeId, {
          title: next.title,
          document: next.document,
          status: "editing",
        });
        setError(null);
        dirty.current = false;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save.");
      } finally {
        setSaving(false);
      }
    },
    [user, resumeId],
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
    return <CenteredMessage>Loading resume…</CenteredMessage>;
  }

  if (!user) {
    return <CenteredMessage>Sign in to edit this resume.</CenteredMessage>;
  }

  if (missing) {
    return <CenteredMessage>This resume no longer exists.</CenteredMessage>;
  }

  if (!draft) return null;

  const { document } = draft;

  const changeDocument = (next: ResumeDocument) => edit({ ...draft, document: next });

  // Style changes ride the same debounced save as every keystroke, so there
  // is no second write path to keep consistent.
  const changeTemplate = (templateId: ResumeTemplateId) =>
    changeDocument({ ...document, templateId });
  const changeTheme = (theme: DocumentTheme) =>
    changeDocument({ ...document, theme });

  // Show the user their own content in each template — unless they have not
  // written any yet, in which case a blank sheet would say nothing.
  const thumbnailSource = isResumeEmpty(document)
    ? { ...SAMPLE_RESUME, theme: document.theme }
    : document;

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        title={draft.title}
        onTitleChange={(title) => edit({ ...draft, title })}
        activeTab={tab}
        onTabChange={setTab}
        saving={saving}
        savedAt={savedAt}
        error={error}
      />

      <SplitPane
        storageKey="vitecv:editor-split"
        label="Resize editor and preview"
        primary={
          tab === "editor" ? (
            <SectionList document={document} onChange={changeDocument} />
          ) : (
            <StylePanel
              templates={RESUME_TEMPLATE_LIST}
              templateId={document.templateId}
              theme={document.theme}
              onTemplateChange={changeTemplate}
              onThemeChange={changeTheme}
              galleryHref="/resume/templates"
              renderThumbnail={(id) => (
                <DocumentThumbnail>
                  <ResumePreview
                    document={{ ...thumbnailSource, templateId: id }}
                  />
                </DocumentThumbnail>
              )}
            />
          )
        }
        secondary={
          <PreviewPane>
            <ResumePreview document={document} />
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
