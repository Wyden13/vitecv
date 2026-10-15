/**
 * Turns an uploaded file into plain text, one visual line per line.
 *
 * Line boundaries matter downstream: the structuring step (`libs/resume/parse`)
 * reads headings, bullets and date lines off them, and its coverage check maps
 * anything left unclaimed back to whole source lines. Text is never rewritten
 * here — only whitespace between fragments is decided.
 */
export async function extractFileText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    return extractPDF(file);
  }

  if (extension === "docx") {
    return extractDOCX(file);
  }

  throw new Error("Unsupported file format");
}

interface PdfFragment {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL: boolean;
}

/**
 * Rebuilds lines from pdf.js text items. Items arrive in content-stream order,
 * which is reading order for nearly every resume; a new line starts on an
 * explicit end-of-line or when the baseline moves. A taller-than-usual jump
 * becomes a blank line, which keeps paragraph and section breaks visible.
 */
function linesFromFragments(fragments: PdfFragment[]): string[] {
  const lines: string[] = [];
  let current = "";
  let lastY: number | null = null;
  let lastEndX: number | null = null;
  let lastHeight = 0;

  const flush = () => {
    lines.push(current.replace(/\s+$/, ""));
    current = "";
    lastEndX = null;
  };

  for (const fragment of fragments) {
    const x = fragment.transform[4];
    const y = fragment.transform[5];
    const size = fragment.height || Math.hypot(fragment.transform[2], fragment.transform[3]) || 10;

    if (lastY !== null && Math.abs(y - lastY) > size * 0.5 && current) {
      const gap = Math.abs(y - lastY);
      flush();
      if (lastHeight && gap > lastHeight * 2) lines.push("");
    }

    if (fragment.str) {
      // pdf.js splits words into runs without spaces; insert one only where the
      // horizontal gap is wide enough to have been a space on the page.
      const needsSpace =
        current &&
        lastEndX !== null &&
        !/\s$/.test(current) &&
        !/^\s/.test(fragment.str) &&
        x - lastEndX > size * 0.15;

      current += (needsSpace ? " " : "") + fragment.str;
      lastEndX = x + fragment.width;
      lastY = y;
      lastHeight = size;
    }

    if (fragment.hasEOL && current) flush();
  }

  if (current) flush();
  return lines;
}

async function extractPDF(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
  });

  const pdf = await loadingTask.promise;

  const pages: string[] = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const fragments = content.items.filter(
        (item): item is typeof item & PdfFragment => "str" in item,
      );

      pages.push(linesFromFragments(fragments).join("\n"));
    }
  } finally {
    await loadingTask.destroy();
  }

  return tidy(pages.join("\n\n"));
}

const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6"]);

/**
 * Walks mammoth's HTML instead of using `extractRawText`, which flattens list
 * items into paragraphs and loses which lines were bullets. List items get a
 * "• " prefix so the structuring step sees them as bullets.
 */
function linesFromHtml(root: Element, lines: string[]) {
  for (const child of Array.from(root.children)) {
    if (BLOCK_TAGS.has(child.tagName)) {
      lines.push(child.textContent ?? "");
      continue;
    }

    if (child.tagName === "LI") {
      // Own text only; nested lists are walked as their own items below.
      const own = Array.from(child.childNodes)
        .filter((node) => !(node instanceof Element && /^(UL|OL)$/.test(node.tagName)))
        .map((node) => node.textContent ?? "")
        .join("");

      lines.push(`• ${own.trim()}`);
      child
        .querySelectorAll(":scope > ul, :scope > ol")
        .forEach((list) => linesFromHtml(list, lines));
      continue;
    }

    if (child.tagName === "TABLE" || child.tagName === "UL" || child.tagName === "OL") {
      linesFromHtml(child, lines);
      if (child.tagName === "TABLE") lines.push("");
      continue;
    }

    linesFromHtml(child, lines);
  }
}

async function extractDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");

  const buffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml({
    arrayBuffer: buffer,
  });

  const parsed = new DOMParser().parseFromString(result.value, "text/html");
  const lines: string[] = [];
  linesFromHtml(parsed.body, lines);

  return tidy(lines.join("\n"));
}

/** Trailing spaces off, runs of blank lines collapsed to one. */
function tidy(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
