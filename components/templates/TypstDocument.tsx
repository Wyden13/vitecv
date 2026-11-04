"use client";

import { useEffect, useRef, useState } from "react";

import {
  compileSvg,
  formatTypstError,
  isEngineError,
  type SvgResult,
  type TypstKind,
} from "@/libs/typst/client";
import { svgLayout } from "@/libs/typst/pages";

/** Recompiles while typing wait this long after the last change. */
const DEBOUNCE_MS = 250;

/** The sheet the HTML templates used to render on: white Letter paper. */
const SHEET =
  "doc-surface w-[8.5in] overflow-hidden bg-white shadow-lg print:shadow-none [&_svg]:block [&_svg]:h-auto [&_svg]:w-full";

export interface TypstDocumentProps {
  kind: TypstKind;
  template: string;
  /** Output of `toTypstResume` / `toTypstCoverLetter`. */
  doc: unknown;
}

/**
 * A document typeset by Typst in the browser, shown as Letter-sized sheets at
 * true size (8.5in wide), so it drops into `PreviewPane` and
 * `DocumentThumbnail` exactly like the HTML page it replaces. What is on
 * screen is the same layout the PDF download produces.
 */
export default function TypstDocument({ kind, template, doc }: TypstDocumentProps) {
  // Keyed on the serialized document so object identity churn never
  // recompiles; only real content changes do.
  const docJson = JSON.stringify(doc);
  const [result, setResult] = useState<SvgResult | null>(null);
  const [error, setError] = useState<{ message: string; engine: boolean } | null>(null);
  const [compiling, setCompiling] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const rendered = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setCompiling(true);
        try {
          const next = await compileSvg(kind, template, docJson);
          if (cancelled) return;
          rendered.current = true;
          setResult(next);
          setError(null);
        } catch (caught) {
          if (cancelled) return;
          setError({ message: formatTypstError(caught), engine: isEngineError(caught) });
        } finally {
          if (!cancelled) setCompiling(false);
        }
      },
      rendered.current ? DEBOUNCE_MS : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [kind, template, docJson, attempt]);

  const errorPanel = error && (
    <div
      role="alert"
      className="mb-4 w-[8.5in] rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden"
    >
      <p className="font-medium">
        {error.engine ? "The preview engine could not load." : "This document could not be typeset."}
      </p>
      <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs">{error.message}</pre>
      {error.engine && (
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="mt-2 font-medium underline underline-offset-2 hover:text-red-900"
        >
          Retry
        </button>
      )}
    </div>
  );

  if (!result) {
    return (
      <>
        {errorPanel}
        <div className={`${SHEET} flex aspect-[8.5/11] items-center justify-center`}>
          {!error && <span className="text-sm text-zinc-400">Rendering preview…</span>}
        </div>
      </>
    );
  }

  const dimmed = compiling || error !== null;
  const layout = svgLayout(result.svg, result.pageCount);

  return (
    <>
      {errorPanel}
      <div className={`space-y-6 transition-opacity ${dimmed ? "opacity-70" : "opacity-100"}`}>
        {!layout || layout.pages.length <= 1 ? (
          <div className={SHEET} dangerouslySetInnerHTML={{ __html: result.svg }} />
        ) : (
          // typst.ts renders every page into one tall SVG; each sheet is a
          // window onto it, shifted up by that page's offset.
          layout.pages.map((page, index) => (
            <div
              key={index}
              className={`${SHEET} relative`}
              style={{ aspectRatio: `${page.width} / ${page.height}` }}
            >
              <div
                aria-hidden={index > 0 || undefined}
                className="absolute inset-x-0 top-0"
                style={{ transform: `translateY(-${(page.y / layout.height) * 100}%)` }}
                dangerouslySetInnerHTML={{ __html: result.svg }}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}
