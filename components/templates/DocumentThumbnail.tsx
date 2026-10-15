"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A page shrunk to fit whatever box it is given.
 *
 * Deliberately not `.doc-page-scaler`: that one scales from `top center` so a
 * full-width preview stays centred in its pane, which throws the content off
 * to the side once the box is much narrower than the 816px page. Scaling from
 * `top left` inside a fixed Letter-ratio frame keeps a small card exact.
 */

const PAGE_WIDTH_PX = 816; // 8.5in at 96dpi
const PAGE_HEIGHT_PX = 1056; // 11in

export interface DocumentThumbnailProps {
  children: ReactNode;
}

export default function DocumentThumbnail({
  children,
}: DocumentThumbnailProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width;
      if (available > 0) setScale(available / PAGE_WIDTH_PX);
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      aria-hidden="true"
      className="pointer-events-none relative w-full select-none overflow-hidden bg-white"
      style={{ aspectRatio: `${PAGE_WIDTH_PX} / ${PAGE_HEIGHT_PX}` }}
    >
      {scale !== null && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: PAGE_WIDTH_PX,
            height: PAGE_HEIGHT_PX,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
