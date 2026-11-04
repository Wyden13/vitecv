// Browser-only singleton around @myriaddreamin/typst.ts (Typst 0.13 compiled
// to WebAssembly). Every preview, thumbnail and PDF download goes through
// here. Never call it from a Server Component: all typst imports are dynamic,
// so an accidental server evaluation stays inert, and `init()` refuses to run
// outside a browser.
//
// Assets, all served from /public/typst:
//   wasm/*.wasm     copied from node_modules by scripts/copy-typst-wasm.mjs
//   fonts/*         vendored (OFL / GUST); remote font assets are disabled
//   main.typ        entry point: picks the template, reads sys.inputs
//   lib/, templates/ shared helpers and the styling templates

type Snippet = typeof import("@myriaddreamin/typst.ts/contrib/snippet");
type TypstInstance = Snippet["$typst"];

export type TypstKind = "resume" | "letter";

const WASM_COMPILER = "/typst/wasm/typst_ts_web_compiler_bg.wasm";
const WASM_RENDERER = "/typst/wasm/typst_ts_renderer_bg.wasm";
const MAIN_FILE = "/main.typ";

/**
 * Every .typ file the compiler can import, registered at the same root paths
 * the Typst CLI sees with `--root public/typst`. Adding a template means
 * adding its file here (and to main.typ and libs/typst/templates.ts).
 */
const SOURCES = [
  MAIN_FILE,
  "/lib/theme.typ",
  "/templates/resume/classic.typ",
  "/templates/resume/modern.typ",
  "/templates/resume/harvard.typ",
  "/templates/letter/formal.typ",
  "/templates/letter/modernLetter.typ",
];

/** Every family `TYPST_FONT_PAIRS` (libs/typst/theme.ts) can name. */
const FONT_URLS = [
  ...["Regular", "Italic", "SemiBold", "Bold"].map((w) => `/typst/fonts/Geist-${w}.ttf`),
  ...["Regular", "It", "Semibold", "Bold"].map((w) => `/typst/fonts/SourceSerif4-${w}.ttf`),
  ...["Regular", "Italic", "SemiBold", "Bold"].map((w) => `/typst/fonts/EBGaramond-${w}.ttf`),
  ...["regular", "italic", "bold", "bolditalic"].map((w) => `/typst/fonts/texgyretermes-${w}.otf`),
];

let instancePromise: Promise<TypstInstance> | null = null;
// The wasm compiler is single-threaded and shares shadow-file state, so all
// compiles are serialized through this chain.
let queue: Promise<unknown> = Promise.resolve();

/** The engine itself (wasm, fonts, templates) failed to load, as opposed to one document failing to compile. */
export class TypstEngineError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TypstEngineError";
  }
}

export const isEngineError = (err: unknown): err is TypstEngineError =>
  err instanceof TypstEngineError;

function explainEngineFailure(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/unsafe-eval|Content Security Policy|trusted-types/i.test(raw)) {
    return "The browser's security policy blocked the preview engine from starting. Reload the page; if it persists, report it.";
  }
  if (/Failed to fetch|NetworkError|Load failed|404|503/i.test(raw)) {
    return `A file the preview engine needs could not be downloaded (${raw}). Check your connection and try again.`;
  }
  if (/WebAssembly|wasm/i.test(raw)) {
    return `The preview engine (WebAssembly) could not start in this browser: ${raw}`;
  }
  return `The preview engine could not start: ${raw}`;
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(`/typst${path}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to fetch /typst${path}: ${res.status} ${res.statusText}`);
  return res.text();
}

async function init(): Promise<TypstInstance> {
  if (typeof window === "undefined") {
    throw new TypstEngineError("Typst can only be initialized in the browser");
  }
  const { TypstSnippet } = await import("@myriaddreamin/typst.ts/contrib/snippet");

  // A fresh snippet per attempt: `use()` may only be called once per
  // instance, so re-using the package's shared `$typst` after a failed start
  // would throw "already prepare uses for instances" and hide the real cause.
  const typst = new TypstSnippet();
  typst.setCompilerInitOptions({ getModule: () => WASM_COMPILER });
  typst.setRendererInitOptions({ getModule: () => WASM_RENDERER });
  // Providers must be registered before the first compile.
  typst.use(TypstSnippet.disableDefaultFontAssets(), TypstSnippet.preloadFonts(FONT_URLS));

  const sources = await Promise.all(SOURCES.map(fetchText));
  // Sequentially, never with Promise.all: the snippet builds its compiler
  // lazily on first use and that lazy getter is not race-safe, so concurrent
  // calls each instantiate the same wasm module and corrupt its heap
  // ("dlmalloc assertion failed" / "recursive use of an object").
  for (const [i, path] of SOURCES.entries()) {
    await typst.addSource(path, sources[i]);
  }

  return typst;
}

/** Idempotent: loads wasm, fonts and template sources once. Re-armed on failure, so a retry starts clean. */
export function ensureTypst(): Promise<TypstInstance> {
  if (!instancePromise) {
    instancePromise = init().catch((err: unknown) => {
      instancePromise = null;
      console.error("[typst] engine failed to start:", err);
      throw err instanceof TypstEngineError
        ? err
        : new TypstEngineError(explainEngineFailure(err), { cause: err });
    });
  }
  return instancePromise;
}

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.catch(() => undefined);
  return run;
}

function inputs(kind: TypstKind, template: string, docJson: string): Record<string, string> {
  return { kind, template, doc: docJson };
}

export interface SvgResult {
  svg: string;
  pageCount: number;
}

function countSvgPages(svg: string): number {
  return Math.max(1, (svg.match(/class="typst-page"/g) ?? []).length);
}

// Thumbnails, the gallery and the live preview often ask for the same
// document (the Style tab shows the current template as both), and switching
// tabs remounts them. Identical requests share one compile.
const SVG_CACHE_SIZE = 24;
const svgCache = new Map<string, Promise<SvgResult>>();

/** `docJson` is the serialized output of `toTypstResume` / `toTypstCoverLetter`. */
export function compileSvg(kind: TypstKind, template: string, docJson: string): Promise<SvgResult> {
  const key = `${kind}\u0000${template}\u0000${docJson}`;
  const cached = svgCache.get(key);
  if (cached) {
    // Refresh recency.
    svgCache.delete(key);
    svgCache.set(key, cached);
    return cached;
  }

  const result = enqueue(async () => {
    const $typst = await ensureTypst();
    const svg = await $typst.svg({ mainFilePath: MAIN_FILE, inputs: inputs(kind, template, docJson) });
    if (!svg) throw new Error("Typst returned an empty document");
    return { svg, pageCount: countSvgPages(svg) };
  });

  svgCache.set(key, result);
  // Failures are not cached: a retry must compile again.
  result.catch(() => svgCache.delete(key));
  if (svgCache.size > SVG_CACHE_SIZE) {
    svgCache.delete(svgCache.keys().next().value!);
  }
  return result;
}

export function compilePdf(kind: TypstKind, template: string, docJson: string): Promise<Uint8Array> {
  return enqueue(async () => {
    const $typst = await ensureTypst();
    const pdf = await $typst.pdf({ mainFilePath: MAIN_FILE, inputs: inputs(kind, template, docJson) });
    if (!pdf) throw new Error("Typst returned no PDF data");
    return pdf;
  });
}

/** Compiles the PDF and hands it to the browser as a download. */
export async function downloadPdf(
  kind: TypstKind,
  template: string,
  docJson: string,
  fileName: string,
): Promise<void> {
  const bytes = await compilePdf(kind, template, docJson);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick: Safari cancels a download whose URL is revoked synchronously.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** "Avery Lin — Resume" -> "Avery Lin — Resume.pdf", with characters file systems reject removed. */
export function pdfFileName(...candidates: string[]): string {
  const base = candidates
    .map((c) => c.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim())
    .find(Boolean);
  return `${(base ?? "document").slice(0, 120)}.pdf`;
}

// typst.ts 0.7 throws compile errors as a Rust debug string such as
// `[SourceDiagnostic { severity: Error, span: ..., message: "...", hints: [] }]`.
function prettifyDiagnostics(raw: string): string {
  const messages = [...raw.matchAll(/severity:\s*(\w+)[^{}]*?message:\s*"((?:[^"\\]|\\.)*)"/g)].map(
    (m) => `${m[1].toLowerCase()}: ${m[2].replace(/\\"/g, '"').replace(/\\n/g, "\n")}`,
  );
  if (messages.length > 0) return messages.join("\n");
  if (/already prepare uses/.test(raw)) {
    return "The preview engine was started twice after a failed load. Reload the page.";
  }
  return raw;
}

/** Turns whatever typst.ts throws (string, Error, diagnostics array/object) into readable text. */
export function formatTypstError(err: unknown): string {
  if (typeof err === "string") return prettifyDiagnostics(err);
  if (err instanceof Error) return err.message;
  if (Array.isArray(err)) return err.map(formatTypstError).join("\n");
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.diagnostics)) return formatTypstError(o.diagnostics);
    try {
      return JSON.stringify(err, null, 2);
    } catch {
      /* fall through */
    }
  }
  return String(err);
}
