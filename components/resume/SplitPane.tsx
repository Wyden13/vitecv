"use client";

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { GripIcon } from "../icons";

const MIN_RATIO = 0.25;
const MAX_RATIO = 0.8;
const DEFAULT_RATIO = 0.5;
const KEYBOARD_STEP = 0.02;

const clamp = (value: number) =>
  Math.min(MAX_RATIO, Math.max(MIN_RATIO, value));

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const serverSnapshot = () => null;

export interface SplitPaneProps {
  primary: ReactNode;
  secondary: ReactNode;
  storageKey: string;
  label: string;
}

export default function SplitPane({
  primary,
  secondary,
  storageKey,
  label,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [override, setOverride] = useState<number | null>(null);

  // localStorage is an external store, so read it through the API built for
  // one: the server snapshot keeps the first client render matching the HTML,
  // which a read inside an effect would not.
  const stored = useSyncExternalStore(
    subscribeToStorage,
    useCallback(() => window.localStorage.getItem(storageKey), [storageKey]),
    serverSnapshot,
  );

  const storedRatio = stored === null ? null : Number.parseFloat(stored);
  const ratio =
    override ??
    (storedRatio !== null && Number.isFinite(storedRatio)
      ? clamp(storedRatio)
      : DEFAULT_RATIO);

  const latestRatio = useRef(ratio);

  const persist = useCallback(
    (value: number) => {
      window.localStorage.setItem(storageKey, String(value));
    },
    [storageKey],
  );

  const commit = useCallback(
    (value: number) => {
      const next = clamp(value);
      latestRatio.current = next;
      setOverride(next);
      persist(next);
    },
    [persist],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    latestRatio.current = ratio;
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    const next = clamp((event.clientX - rect.left) / rect.width);
    latestRatio.current = next;
    setOverride(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    persist(latestRatio.current);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const next = {
      ArrowLeft: ratio - KEYBOARD_STEP,
      ArrowRight: ratio + KEYBOARD_STEP,
      Home: MIN_RATIO,
      End: MAX_RATIO,
      Enter: DEFAULT_RATIO,
    }[event.key];

    if (next === undefined) return;

    event.preventDefault();
    commit(next);
  };

  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 flex-1 ${dragging ? "cursor-col-resize select-none" : ""}`}
      style={{ "--split-ratio": ratio } as CSSProperties}
    >
      <div className="w-full min-w-0 overflow-y-auto lg:w-[calc(var(--split-ratio)*100%)] lg:flex-none print:hidden">
        {primary}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={label}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(MIN_RATIO * 100)}
        aria-valuemax={Math.round(MAX_RATIO * 100)}
        tabIndex={0}
        title="Drag to resize · double-click to reset"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => commit(DEFAULT_RATIO)}
        className={`group relative hidden w-1.5 shrink-0 touch-none cursor-col-resize items-center justify-center border-x transition-colors focus-visible:outline-none lg:flex print:hidden ${dragging
            ? "border-accent-border bg-accent-subtle"
            : "border-zinc-200 bg-zinc-100 hover:bg-accent-subtle dark:border-zinc-800 dark:bg-zinc-900"
          }`}
      >
        <span
          className={`absolute flex h-10 w-4 cursor-col-resize items-center justify-center rounded-full border transition-colors ${dragging
              ? "border-accent-border bg-accent-subtle text-accent"
              : "border-zinc-200 bg-background text-zinc-400 group-hover:text-accent group-focus-visible:border-accent group-focus-visible:text-accent dark:border-zinc-800"
            }`}
        >
          <GripIcon className="size-3.5" />
        </span>
      </div>

      <div className="hidden min-w-0 lg:block lg:flex-1 print:block print:w-full">
        {secondary}
      </div>
    </div>
  );
}
