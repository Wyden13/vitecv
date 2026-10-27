"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";

import Button from "@/components/Button";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { formatRelativeTime } from "@/libs/formatRelativeTime";
import {
  builtinSectionDescriptors,
  createEmptyLibraryItem,
  createEmptyLibrarySection,
  customSectionDescriptor,
  groupLibraryItems,
  libraryItemToInput,
  PROFILE_SECTION_KEY,
  type LibraryItem,
  type LibraryItemInput,
  type LibrarySectionDescriptor,
  type LibrarySectionMeta,
} from "@/libs/library/librarySchema";
import {
  createLibraryItem,
  createLibrarySection,
  deleteLibraryItem,
  deleteLibrarySection,
  reorderLibraryItems,
  subscribeToLibraryItems,
  subscribeToLibrarySections,
  updateLibraryItem,
  updateLibrarySection,
} from "@/libs/library/libraryService";
import type { SectionLayout } from "@/libs/resume/resumeSchema";
import CustomSectionSheet from "./CustomSectionSheet";
import ImportFromResumeSheet from "./ImportFromResumeSheet";
import LibraryItemSheet from "./LibraryItemSheet";
import LibraryNav from "./LibraryNav";
import LibraryProfileCard from "./LibraryProfileCard";
import LibrarySection from "./LibrarySection";
import LibrarySectionRow from "./LibrarySectionRow";
import Message from "./Message";
import { sectionIcon } from "./sectionIcons";

/**
 * The profile is a section in the nav but not a list of items, so it carries a
 * placeholder `layout` that is never read: every path that would use it checks
 * `key === PROFILE_SECTION_KEY` first and renders `LibraryProfileCard`.
 */
const PROFILE_DESCRIPTOR: LibrarySectionDescriptor = {
  key: PROFILE_SECTION_KEY,
  presetId: PROFILE_SECTION_KEY,
  layout: "text",
  heading: "Profile",
  hint: "Your name and contact details, shared by every document.",
  custom: false,
};

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

interface ItemDraft {
  section: LibrarySectionDescriptor;
  initial: LibraryItemInput;
  /** Null when adding. */
  id: string | null;
}

export default function LibraryView() {
  const { user, loading: authLoading } = useFirebaseUser();
  const { notify } = useToast();

  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [sections, setSections] = useState<LibrarySectionMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState(PROFILE_SECTION_KEY);
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);
  const [sectionDraft, setSectionDraft] = useState<{
    editing: LibrarySectionMeta | null;
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingSection, setConfirmingSection] = useState<string | null>(
    null,
  );

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Held in state rather than read during render, so "just now" ages into
  // "2 minutes ago" without a navigation. Same approach as ResumeList.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  const descriptors = useMemo(
    () => [
      PROFILE_DESCRIPTOR,
      ...builtinSectionDescriptors(),
      ...(sections ?? []).map(customSectionDescriptor),
    ],
    [sections],
  );

  const grouped = useMemo(() => groupLibraryItems(items ?? []), [items]);

  const counts = useMemo(() => {
    const totals = new Map<string, number>();

    for (const descriptor of descriptors) {
      if (descriptor.key === PROFILE_SECTION_KEY) continue;
      totals.set(descriptor.key, grouped.get(descriptor.key)?.length ?? 0);
    }

    return totals;
  }, [descriptors, grouped]);

  // A section deleted while selected falls back to the profile.
  const selected =
    descriptors.find((descriptor) => descriptor.key === selectedKey) ??
    PROFILE_DESCRIPTOR;
  const selectedItems = useMemo(
    () => grouped.get(selected.key) ?? [],
    [grouped, selected.key],
  );

  /**
   * Deleting an item leaves a gap in `order`, so the count is not a free slot —
   * reusing it would tie with an existing item and leave the two in whichever
   * sequence Firestore's document-id tiebreak picks.
   */
  const nextItemOrder = selectedItems.length
    ? Math.max(...selectedItems.map((item) => item.order)) + 1
    : 0;

  const handleSaveItem = useCallback(
    async (input: LibraryItemInput) => {
      if (!user || !itemDraft) return;

      setSaving(true);
      try {
        if (itemDraft.id) {
          await updateLibraryItem(user.uid, itemDraft.id, input);
          notify({ variant: "success", message: "Item updated" });
        } else {
          await createLibraryItem(user.uid, input);
          notify({ variant: "success", message: "Item added" });
        }
        setItemDraft(null);
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error ? caught.message : "Could not save item.",
        });
      } finally {
        setSaving(false);
      }
    },
    [user, itemDraft, notify],
  );

  const handleDeleteItem = useCallback(
    async (item: LibraryItem) => {
      if (!user) return;

      setDeletingId(item.id);
      try {
        await deleteLibraryItem(user.uid, item.id);
        notify({ variant: "success", message: "Item deleted" });
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error ? caught.message : "Could not delete item.",
        });
      } finally {
        setDeletingId(null);
        setConfirmingId(null);
      }
    },
    [user, notify],
  );

  const handleReorder = useCallback(
    async (from: number, to: number) => {
      if (!user) return;

      const next = move(selectedItems, from, to);
      if (next === selectedItems) return;

      try {
        await reorderLibraryItems(
          user.uid,
          next.map((item) => item.id),
        );
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error
              ? caught.message
              : "Could not reorder items.",
        });
      }
    },
    [user, selectedItems, notify],
  );

  const handleSaveSection = useCallback(
    async (values: { heading: string; layout: SectionLayout }) => {
      if (!user || !sectionDraft) return;

      setSaving(true);
      try {
        if (sectionDraft.editing) {
          await updateLibrarySection(user.uid, sectionDraft.editing.id, {
            heading: values.heading,
          });
          notify({ variant: "success", message: "Section renamed" });
        } else {
          const existing = sections ?? [];
          const order = existing.length
            ? Math.max(...existing.map((section) => section.order)) + 1
            : 0;

          const created = await createLibrarySection(user.uid, {
            ...createEmptyLibrarySection(values.layout, order),
            heading: values.heading,
          });
          setSelectedKey(created);
          notify({ variant: "success", message: `Added ${values.heading}` });
        }
        setSectionDraft(null);
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error
              ? caught.message
              : "Could not save section.",
        });
      } finally {
        setSaving(false);
      }
    },
    [user, sectionDraft, sections, notify],
  );

  const handleDeleteSection = useCallback(
    async (section: LibrarySectionDescriptor) => {
      if (!user) return;

      setSaving(true);
      try {
        await deleteLibrarySection(user.uid, section.key);
        setSelectedKey(PROFILE_SECTION_KEY);
        notify({ variant: "success", message: `Deleted ${section.heading}` });
      } catch (caught) {
        notify({
          variant: "error",
          message:
            caught instanceof Error
              ? caught.message
              : "Could not delete section.",
        });
      } finally {
        setSaving(false);
        setConfirmingSection(null);
      }
    },
    [user, notify],
  );

  const handleDrop = (id: string) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDropTargetId(null);

    if (!draggingId || draggingId === id) return;

    void handleReorder(
      selectedItems.findIndex((item) => item.id === draggingId),
      selectedItems.findIndex((item) => item.id === id),
    );
    setDraggingId(null);
  };

  if (authLoading || (user && (items === null || sections === null) && !error)) {
    return <Message>Loading your library…</Message>;
  }

  if (!user) return <Message>Sign in to build your library.</Message>;

  if (error) {
    return <Message tone="error">Could not load your library: {error}</Message>;
  }

  const isProfile = selected.key === PROFILE_SECTION_KEY;
  const custom = sections?.find((section) => section.id === selected.key);

  return (
    <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[13rem_1fr] md:items-start">
      <LibraryNav
        sections={descriptors}
        counts={counts}
        selectedKey={selected.key}
        onSelect={(key) => {
          setSelectedKey(key);
          setConfirmingId(null);
          setConfirmingSection(null);
        }}
        onAddSection={() => setSectionDraft({ editing: null })}
        onImport={() => setImportOpen(true)}
      />

      <LibrarySection
        icon={sectionIcon(selected.presetId)}
        title={selected.heading}
        hint={selected.hint}
        count={isProfile ? undefined : selectedItems.length}
        headerActions={
          isProfile ? null : confirmingSection === selected.key ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleDeleteSection(selected)}
                disabled={saving}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                {saving ? "Deleting…" : "Delete section"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingSection(null)}
                className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {custom && (
                <>
                  <button
                    type="button"
                    onClick={() => setSectionDraft({ editing: custom })}
                    aria-label={`Rename ${selected.heading}`}
                    className="rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingSection(selected.key)}
                    aria-label={`Delete ${selected.heading}`}
                    className="rounded p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </>
              )}
              <Button
                size="sm"
                icon={<PlusIcon className="size-4" />}
                onClick={() =>
                  setItemDraft({
                    section: selected,
                    initial: createEmptyLibraryItem(selected, nextItemOrder),
                    id: null,
                  })
                }
              >
                Add item
              </Button>
            </>
          )
        }
      >
        {isProfile ? (
          <LibraryProfileCard />
        ) : selectedItems.length === 0 ? (
          <Message>
            Nothing here yet — add your first item and it is ready to drop into
            any resume.
          </Message>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {selectedItems.map((item, index) => (
              <LibrarySectionRow
                key={item.id}
                item={item}
                updatedLabel={
                  item.updatedAt ? formatRelativeTime(item.updatedAt, now) : null
                }
                onEdit={() =>
                  setItemDraft({
                    section: selected,
                    initial: libraryItemToInput(item),
                    id: item.id,
                  })
                }
                confirming={confirmingId === item.id}
                deleting={deletingId === item.id}
                onRequestDelete={() => setConfirmingId(item.id)}
                onCancelDelete={() => setConfirmingId(null)}
                onConfirmDelete={() => void handleDeleteItem(item)}
                canMoveUp={index > 0}
                canMoveDown={index < selectedItems.length - 1}
                onMoveUp={() => void handleReorder(index, index - 1)}
                onMoveDown={() => void handleReorder(index, index + 1)}
                isDragging={draggingId === item.id}
                isDropTarget={
                  dropTargetId === item.id && draggingId !== item.id
                }
                onDragStart={(event) => {
                  setDraggingId(item.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropTargetId(item.id);
                }}
                onDrop={handleDrop(item.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropTargetId(null);
                }}
              />
            ))}
          </ul>
        )}
      </LibrarySection>

      {itemDraft && (
        <LibraryItemSheet
          key={itemDraft.id ?? `new-${itemDraft.section.key}`}
          open
          section={itemDraft.section}
          initial={itemDraft.initial}
          editing={itemDraft.id !== null}
          saving={saving}
          onClose={() => setItemDraft(null)}
          onSave={(input) => void handleSaveItem(input)}
        />
      )}

      {sectionDraft && (
        <CustomSectionSheet
          key={sectionDraft.editing?.id ?? "new-section"}
          open
          editing={sectionDraft.editing}
          saving={saving}
          onClose={() => setSectionDraft(null)}
          onSave={(values) => void handleSaveSection(values)}
        />
      )}

      <ImportFromResumeSheet
        open={importOpen}
        sections={sections ?? []}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
