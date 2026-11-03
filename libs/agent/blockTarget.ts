import {
  visibleEntries,
  visibleSections,
} from "@/components/resume/templates/shared";
import type { ResumeDocument } from "@/libs/resume/resumeSchema";

/**
 * Resolving an insight's `blockId` back to the place in the document that
 * produced it.
 *
 * `libs/insights/resumeText.ts` numbers blocks positionally while walking the
 * *filtered* views — `visibleSections`, `visibleEntries`, `visibleBullets`.
 * Resolution has to walk the same filters: a resume carrying one blank bullet
 * above a real one would otherwise resolve `…-b1` to the blank row and write
 * the rewrite into the wrong line.
 *
 * Only three block kinds are writable. The rest are refused rather than
 * approximated:
 *  - `entry` and `skills` block text is a composite join of several fields
 *    ("title — subtitle — meta", "group: items"), so there is no single field
 *    to write back to.
 *  - `p` is likewise "name — title — location".
 *  - `r{n}` comes from `blocksFromRawText(resume.rawText)` — the uploaded
 *    file, not the document, so it has no location here at all.
 */

export type BlockTarget =
  | { kind: "bullet"; sectionId: string; entryId: string; bulletIndex: number }
  | { kind: "text"; sectionId: string }
  | { kind: "list"; sectionId: string; itemIndex: number };

const TEXT_BLOCK = /^s(\d+)$/;
const BULLET_BLOCK = /^s(\d+)-e(\d+)-b(\d+)$/;
const LIST_BLOCK = /^s(\d+)-l(\d+)$/;

/**
 * The stored index of the `nth` (1-based) non-blank string, or -1 — the bridge
 * between a filtered view's numbering and the array behind it.
 *
 * "Non-blank" must stay in lockstep with `visibleBullets` and
 * `visibleListItems`, which both filter on `.trim()`. If their definition of
 * visible ever changes, this moves with them.
 */
function nthVisibleIndex(values: string[], nth: number): number {
  let seen = 0;

  for (let index = 0; index < values.length; index += 1) {
    if (!values[index].trim()) continue;

    seen += 1;
    if (seen === nth) return index;
  }

  return -1;
}

export function resolveBlockTarget(
  document: ResumeDocument,
  blockId: string,
): BlockTarget | null {
  const sections = visibleSections(document.sections);

  const bullet = BULLET_BLOCK.exec(blockId);
  if (bullet) {
    const section = sections[Number(bullet[1]) - 1];
    if (section?.layout !== "timeline") return null;

    const entry = visibleEntries(section.entries)[Number(bullet[2]) - 1];
    if (!entry) return null;

    const bulletIndex = nthVisibleIndex(entry.bullets, Number(bullet[3]));
    if (bulletIndex < 0) return null;

    return {
      kind: "bullet",
      sectionId: section.id,
      entryId: entry.id,
      bulletIndex,
    };
  }

  const list = LIST_BLOCK.exec(blockId);
  if (list) {
    const section = sections[Number(list[1]) - 1];
    if (section?.layout !== "list") return null;

    const itemIndex = nthVisibleIndex(section.items, Number(list[2]));
    if (itemIndex < 0) return null;

    return { kind: "list", sectionId: section.id, itemIndex };
  }

  const text = TEXT_BLOCK.exec(blockId);
  if (text) {
    const section = sections[Number(text[1]) - 1];
    if (section?.layout !== "text") return null;

    return { kind: "text", sectionId: section.id };
  }

  return null;
}

export function readTarget(
  document: ResumeDocument,
  target: BlockTarget,
): string {
  const section = document.sections.find(
    (candidate) => candidate.id === target.sectionId,
  );
  if (!section) return "";

  if (target.kind === "text") {
    return section.layout === "text" ? section.body : "";
  }

  if (target.kind === "list") {
    return section.layout === "list"
      ? (section.items[target.itemIndex] ?? "")
      : "";
  }

  if (section.layout !== "timeline") return "";

  const entry = section.entries.find((row) => row.id === target.entryId);
  return entry?.bullets[target.bulletIndex] ?? "";
}

export function writeTarget(
  document: ResumeDocument,
  target: BlockTarget,
  value: string,
): ResumeDocument {
  const sections = document.sections.map((section) => {
    if (section.id !== target.sectionId) return section;

    if (target.kind === "text" && section.layout === "text") {
      return { ...section, body: value };
    }

    if (target.kind === "list" && section.layout === "list") {
      return {
        ...section,
        items: section.items.map((item, index) =>
          index === target.itemIndex ? value : item,
        ),
      };
    }

    if (target.kind === "bullet" && section.layout === "timeline") {
      return {
        ...section,
        entries: section.entries.map((entry) =>
          entry.id === target.entryId
            ? {
                ...entry,
                bullets: entry.bullets.map((row, index) =>
                  index === target.bulletIndex ? value : row,
                ),
              }
            : entry,
        ),
      };
    }

    return section;
  });

  return { ...document, sections };
}

/**
 * Returns null when `phrase` is no longer in the target. The analysis is a
 * snapshot and the wording it describes may have been edited since — refusing
 * beats rewriting a line the model never saw.
 */
export function replacePhraseAt(
  document: ResumeDocument,
  target: BlockTarget,
  phrase: string,
  suggestion: string,
): ResumeDocument | null {
  if (!phrase) return null;

  const current = readTarget(document, target);
  const at = current.indexOf(phrase);
  if (at < 0) return null;

  // Spliced rather than `String.replace`, which would read "$&" and friends in
  // a model-written suggestion as replacement patterns.
  const next =
    current.slice(0, at) + suggestion + current.slice(at + phrase.length);

  return writeTarget(document, target, next);
}
