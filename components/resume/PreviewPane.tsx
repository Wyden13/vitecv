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
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  // Unscaled height of the sheets: a multi-page document is taller than the
  // one Letter page `.doc-page-scaler` reclaims by default.
  const [contentHeight, setContentHeight] = useState<number | null>(null);

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

  useEffect(() => {
    const scaler = scalerRef.current;
    if (!scaler) return;

    // Layout size, unaffected by the scale transform.
    const observer = new ResizeObserver(([entry]) =>
      setContentHeight(entry.contentRect.height),
    );

    observer.observe(scaler);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="h-full overflow-y-auto bg-zinc-100 p-6 dark:bg-zinc-900 print:overflow-visible print:bg-white print:p-0"
    >
      <div
        ref={scalerRef}
        className="doc-page-scaler mx-auto"
        style={
          scale === null
            ? undefined
            : ({
                "--doc-scale": scale,
                ...(contentHeight
                  ? {
                      marginBottom: `calc((1 - var(--doc-scale)) * -${contentHeight}px)`,
                    }
                  : {}),
              } as CSSProperties)
        }
      >
        {children}
      </div>
    </div>
  );
}
