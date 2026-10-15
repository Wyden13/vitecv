"use client";

import { useState, type DragEvent, type ReactNode } from "react";

import { ChevronDownIcon, GripIcon } from "../icons";

export interface SectionCardProps {
  title: string;
  hint: string;
  children: ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
}

export default function SectionCard({
  title,
  hint,
  children,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget,
}: SectionCardProps) {
  const [open, setOpen] = useState(true);

  return (
    <section
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border-b border-zinc-200 transition-colors dark:border-zinc-800 ${
        isDragging ? "opacity-40" : ""
      } ${isDropTarget ? "border-t-2 border-t-accent" : ""}`}
    >
      <div className="flex items-start gap-2 px-4 py-4">
        <span
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          aria-hidden="true"
          className="mt-1 cursor-grab text-zinc-300 active:cursor-grabbing dark:text-zinc-700"
        >
          <GripIcon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {hint}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${title} up`}
            className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:hover:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ChevronDownIcon className="size-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${title} down`}
            className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:hover:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ChevronDownIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
            className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ChevronDownIcon
              className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`}
            />
          </button>
        </div>
      </div>

      {open && <div className="px-4 pb-5 pl-10">{children}</div>}
    </section>
  );
}
