"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Button from "@/components/Button";
import { ChevronDownIcon } from "@/components/icons";
import Sheet from "@/components/Sheet";
import Message from "@/components/library/Message";
import { sectionIcon } from "@/components/library/sectionIcons";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { pulledPayloadIds, type LibraryPick } from "@/libs/library/libraryPull";
import {
  builtinSectionDescriptors,
  customSectionDescriptor,
  groupLibraryItems,
  libraryItemLabel,
  type LibraryItem,
  type LibrarySectionDescriptor,
  type LibrarySectionMeta,
} from "@/libs/library/librarySchema";
import {
  subscribeToLibraryItems,
  subscribeToLibrarySections,
} from "@/libs/library/libraryService";
import type { ResumeDocument } from "@/libs/resume/resumeSchema";

export interface LibraryPullSheetProps {
  open: boolean;
  /** Read only, to work out what has already been pulled in. */
  document: ResumeDocument;
  onClose: () => void;
  onPull: (picks: LibraryPick[]) => void;
}

interface PullGroup {
  section: LibrarySectionDescriptor;
  items: LibraryItem[];
}

/**
 * Only timeline entries and skill groups carry an id of their own, so they are
 * the only items that can be recognised once they are in the document.
 */
function payloadId(item: LibraryItem): string | null {
  if (item.layout === "timeline") return item.entry.id;
  if (item.layout === "skills") return item.group.id;
  return null;
}

export default function LibraryPullSheet({
  open,
  document,
  onClose,
  onPull,
}: LibraryPullSheetProps) {
  const { user, loading: authLoading } = useFirebaseUser();

  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [sections, setSections] = useState<LibrarySectionMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Gated on `open` so the drawer holds no listener while it is shut.
  useEffect(() => {
    if (!user || !open) return;

    const unsubscribeItems = subscribeToLibraryItems(user.uid, {
      onData: (next) => {
        setItems(next);
        setError(null);
      },
      onError: (caught) => setError(caught.message),
    });

    const unsubscribeSections = subscribeToLibrarySections(user.uid, {
      onData: (next) => {
        setSections(next);
        setError(null);
      },
      onError: (caught) => setError(caught.message),
    });

    return () => {
      unsubscribeItems();
      unsubscribeSections();
    };
  }, [user, open]);

  const close = () => {
    setSelected(new Set());
    onClose();
  };

  const added = pulledPayloadIds(document);
  const isAdded = (item: LibraryItem) => {
    const id = payloadId(item);
    return id !== null && added.has(id);
  };

  const grouped = groupLibraryItems(items ?? []);

  const groups: PullGroup[] = [
    ...builtinSectionDescriptors(),
    ...(sections ?? []).map(customSectionDescriptor),
  ]
    .map((section) => ({ section, items: grouped.get(section.key) ?? [] }))
    .filter((group) => group.items.length > 0);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleGroup = (group: PullGroup) => {
    const selectable = group.items.filter((item) => !isAdded(item));
    const allOn = selectable.every((item) => selected.has(item.id));

    setSelected((current) => {
      const next = new Set(current);
      for (const item of selectable) {
        if (allOn) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  };

  const handlePull = () => {
    const picks: LibraryPick[] = groups
      .map((group) => ({
        section: group.section,
        items: group.items.filter((item) => selected.has(item.id)),
      }))
      .filter((pick) => pick.items.length > 0);

    onPull(picks);
    setSelected(new Set());
  };

  // Paragraph and bullet-list items have no id to match on, so say so rather
  // than showing an "Added" pill that cannot be trusted.
  const hasUntrackable = groups.some((group) =>
    group.items.some((item) => payloadId(item) === null),
  );

  const loading = authLoading || (user && (items === null || sections === null) && !error);

  return (
    <Sheet
      open={open}
      title="Pull from your library"
      description="Pick the details you want on this resume. Your library is left untouched."
      onClose={close}
      footer={
        <>
          <span
            aria-live="polite"
            className="mr-auto text-xs text-zinc-600 dark:text-zinc-400"
          >
            {selected.size
              ? `${selected.size} selected`
              : "Nothing selected yet"}
          </span>
          <Button variant="ghost" size="sm" onClick={close}>
            Cancel
          </Button>
          <Button size="sm" disabled={!selected.size} onClick={handlePull}>
            Add to resume
          </Button>
        </>
      }
    >
      {loading ? (
        <Message>Loading your library…</Message>
      ) : !user ? (
        <Message>Sign in to use your library.</Message>
      ) : error ? (
        <Message tone="error">Could not load your library: {error}</Message>
      ) : groups.length === 0 ? (
        <Message>
          Your library is empty. Add your experience, education and skills in{" "}
          <Link
            href="/library"
            className="font-medium text-accent hover:underline"
          >
            your library
          </Link>{" "}
          and they will show up here.
        </Message>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const Icon = sectionIcon(group.section.presetId);
            const expanded = !collapsed.has(group.section.key);
            const selectable = group.items.filter((item) => !isAdded(item));
            const allOn =
              selectable.length > 0 &&
              selectable.every((item) => selected.has(item.id));

            return (
              <section key={group.section.key}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((current) => {
                        const next = new Set(current);
                        if (next.has(group.section.key)) {
                          next.delete(group.section.key);
                        } else {
                          next.add(group.section.key);
                        }
                        return next;
                      })
                    }
                    aria-expanded={expanded}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <ChevronDownIcon
                      aria-hidden="true"
                      className={`size-4 shrink-0 text-zinc-400 transition-transform ${
                        expanded ? "" : "-rotate-90"
                      }`}
                    />
                    <Icon className="size-4 shrink-0 text-accent" />
                    <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {group.section.heading}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                      {group.items.length}
                    </span>
                  </button>

                  {selectable.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="shrink-0 rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      {allOn ? "None" : "All"}
                    </button>
                  )}
                </div>

                {expanded && (
                  <ul className="mt-1 flex flex-col gap-0.5 pl-6">
                    {group.items.map((item) => {
                      const { title, meta } = libraryItemLabel(item);
                      const alreadyAdded = isAdded(item);

                      return (
                        <li key={item.id}>
                          <label
                            className={`flex items-start gap-2.5 rounded px-2 py-1.5 ${
                              alreadyAdded
                                ? "opacity-60"
                                : "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(item.id)}
                              disabled={alreadyAdded}
                              onChange={() => toggle(item.id)}
                              className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-zinc-900 dark:text-zinc-50">
                                {title}
                              </span>
                              {meta && (
                                <span className="mt-0.5 block truncate text-xs text-zinc-600 dark:text-zinc-400">
                                  {meta}
                                </span>
                              )}
                            </span>

                            {alreadyAdded && (
                              <span className="shrink-0 rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent">
                                Added
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}

          {hasUntrackable && (
            <p className="border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Paragraph and bullet-list items cannot be tracked once added, so
              they are never marked as already on the resume — adding one twice
              will repeat it.
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
