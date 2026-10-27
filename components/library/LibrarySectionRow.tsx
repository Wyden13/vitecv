"use client";

import type { DragEvent } from "react";

import {
  ChevronDownIcon,
  GripIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import { libraryItemLabel, type LibraryItem } from "@/libs/library/librarySchema";

export interface LibrarySectionRowProps {
  item: LibraryItem;
  /** Pre-formatted by the parent, which owns the ticking `now`. */
  updatedLabel: string | null;
  onEdit: () => void;
  confirming: boolean;
  deleting: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

const ACTION_CLASS =
  "rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 " +
  "disabled:hover:text-zinc-400 dark:hover:text-zinc-50";

export default function LibrarySectionRow({
  item,
  updatedLabel,
  onEdit,
  confirming,
  deleting,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: LibrarySectionRowProps) {
  const { title, meta } = libraryItemLabel(item);
  const details = [meta, updatedLabel ? `edited ${updatedLabel}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-start gap-2 py-2.5 transition-colors ${
        isDragging ? "opacity-40" : ""
      } ${isDropTarget ? "border-t-2 border-t-accent" : ""}`}
    >
      {/* Only the handle is draggable, so a drag can never start on a control. */}
      <span
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-hidden="true"
        className="mt-0.5 shrink-0 cursor-grab text-zinc-300 active:cursor-grabbing dark:text-zinc-700"
      >
        <GripIcon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {title}
        </p>
        {details && (
          <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
            {details}
          </p>
        )}
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={deleting}
            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Drag is pointer-only, so keep a keyboard path to reordering. */}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${title} up`}
            className={ACTION_CLASS}
          >
            <ChevronDownIcon className="size-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${title} down`}
            className={ACTION_CLASS}
          >
            <ChevronDownIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className={ACTION_CLASS}
          >
            <PencilIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRequestDelete}
            aria-label={`Delete ${title}`}
            className="rounded p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      )}
    </li>
  );
}
