"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const PAGE_WIDTH_PX = 816;
const MIN_SCALE = 0.3;
const MAX_SCALE = 1;

export interface PreviewPaneProps {
  children: ReactNode;
}

export default function PreviewPane({ children }: PreviewPaneProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width;
      if (available <= 0) return;

      setScale(
        Math.min(MAX_SCALE, Math.max(MIN_SCALE, available / PAGE_WIDTH_PX)),
      );
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="h-full overflow-y-auto bg-zinc-100 p-6 dark:bg-zinc-900 print:overflow-visible print:bg-white print:p-0"
    >
      <div
        className="doc-page-scaler mx-auto"
        style={
          scale === null
            ? undefined
            : ({ "--doc-scale": scale } as CSSProperties)
        }
      >
        {children}
      </div>
    </div>
  );
}
