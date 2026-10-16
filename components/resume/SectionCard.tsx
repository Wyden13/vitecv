"use client";
import { useState, type DragEvent, type ReactNode } from "react";
import { ChevronDownIcon, GripIcon, TrashIcon } from "../icons";

export interface SectionCardProps {
  heading: string;
  hint: string;
  children: ReactNode;
  onHeadingChange?: (next: string) => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onDragStart?: (event: DragEvent<HTMLElement>) => void;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

const HEADING_CLASS =
  "-ml-1.5 w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 " +
  "text-base font-semibold tracking-tight text-zinc-900 hover:border-zinc-200 " +
  "focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 " +
  "dark:text-zinc-50 dark:hover:border-zinc-800 dark:focus:ring-zinc-100";

export default function SectionCard({
  heading,
  hint,
  children,
  onHeadingChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDropTarget = false,
}: SectionCardProps) {
  const [open, setOpen] = useState(true);

  const name = heading.trim() || "section";

  return (
    <section
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border-b border-zinc-200 transition-colors dark:border-zinc-800 ${isDragging ? "opacity-40" : ""
        } ${isDropTarget ? "border-t-2 border-t-accent" : ""}`}
    >
      <div className="flex items-start gap-2 px-4 py-4">
        {onDragStart ? (
          <span
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            aria-hidden="true"
            className="mt-1 cursor-grab text-zinc-300 active:cursor-grabbing dark:text-zinc-700"
          >
            <GripIcon className="size-4" />
          </span>
        ) : (
          <span aria-hidden="true" className="mt-1 size-4 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          {onHeadingChange ? (
            <input
              value={heading}
              onChange={(event) => onHeadingChange(event.target.value)}
              aria-label="Section heading"
              placeholder="Section heading"
              className={HEADING_CLASS}
            />
          ) : (
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {heading}
            </h3>
          )}
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {hint}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={`Move ${name} up`}
              className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:hover:text-zinc-400 dark:hover:text-zinc-50"
            >
              <ChevronDownIcon className="size-4 rotate-180" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={`Move ${name} down`}
              className="rounded p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:hover:text-zinc-400 dark:hover:text-zinc-50"
            >
              <ChevronDownIcon className="size-4" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${name}`}
              className="rounded p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <TrashIcon className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${name}`}
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
