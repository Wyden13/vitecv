import {
  skillItems,
  visibleBullets,
  visibleEntries,
  visibleListItems,
  visibleSections,
  visibleSkillGroups,
} from "@/components/resume/templates/shared";
import type { ResumeRecord } from "@/libs/resume/resumeService";

/**
 * Splits a resume into small labelled blocks for analysis.
 *
 * The evidence map needs the model to say *where* a keyword came from. Asking
 * it to describe locations in prose would be unverifiable, so instead we hand
 * it blocks with ids and require citations to be those ids — then filter every
 * citation against the set we sent (`normalizeAnalysisPayload`). A hallucinated
 * location is dropped rather than rendered.
 *
 * Ids are positional, never `createId()`, so the same resume always serializes
 * to the same string. That is what makes the staleness hash meaningful.
 *
 * Email and phone are deliberately left out: they carry no keywords, and there
 * is no reason to send contact details to a third-party model.
 */

export type BlockKind =
  | "profile"
  | "entry"
  | "bullet"
  | "skills"
  | "text"
  | "list"
  | "raw";

export interface TextBlock {
  id: string;
  /** Shown in the evidence panel, e.g. "Experience · Northwind Labs". */
  label: string;
  text: string;
  kind: BlockKind;
}

function push(
  blocks: TextBlock[],
  block: { id: string; label: string; text: string; kind: BlockKind },
) {
  const text = block.text.trim();
  if (text) blocks.push({ ...block, text });
}

/** "Experience · Northwind Labs", or just the heading when there is no detail. */
function label(heading: string, detail?: string): string {
  const parts = [heading.trim() || "Section", detail?.trim()].filter(Boolean);
  return parts.join(" · ");
}

function blocksFromDocument(resume: ResumeRecord): TextBlock[] {
  const blocks: TextBlock[] = [];
  const { profile } = resume.document;

  push(blocks, {
    id: "p",
    label: "Profile",
    text: [profile.name, profile.title, profile.location]
      .filter(Boolean)
      .join(" — "),
    kind: "profile",
  });

  visibleSections(resume.document.sections).forEach((section, index) => {
    const base = `s${index + 1}`;
    const heading = section.heading;

    switch (section.layout) {
      case "timeline":
        visibleEntries(section.entries).forEach((entry, entryIndex) => {
          const entryId = `${base}-e${entryIndex + 1}`;
          const where = label(heading, entry.title);

          push(blocks, {
            id: entryId,
            label: where,
            text: [entry.title, entry.subtitle, entry.meta, entry.start, entry.end]
              .filter(Boolean)
              .join(" — "),
            kind: "entry",
          });

          visibleBullets(entry).forEach((bullet, bulletIndex) => {
            push(blocks, {
              id: `${entryId}-b${bulletIndex + 1}`,
              label: where,
              text: bullet,
              kind: "bullet",
            });
          });
        });
        break;

      case "skills":
        visibleSkillGroups(section.groups).forEach((group, groupIndex) => {
          push(blocks, {
            id: `${base}-g${groupIndex + 1}`,
            label: label(heading, group.group),
            text: [group.group, skillItems(group)].filter(Boolean).join(": "),
            kind: "skills",
          });
        });
        break;

      case "text":
        push(blocks, {
          id: base,
          label: label(heading),
          text: section.body,
          kind: "text",
        });
        break;

      case "list":
        visibleListItems(section.items).forEach((item, itemIndex) => {
          push(blocks, {
            id: `${base}-l${itemIndex + 1}`,
            label: label(heading),
            text: item,
            kind: "list",
          });
        });
        break;
    }
  });

  return blocks;
}

/** Fallback for an upload nobody has structured yet: paragraphs of rawText. */
function blocksFromRawText(rawText: string): TextBlock[] {
  const blocks: TextBlock[] = [];

  rawText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .forEach((paragraph, index) => {
      push(blocks, {
        id: `r${index + 1}`,
        label: "Uploaded file",
        text: paragraph,
        kind: "raw",
      });
    });

  return blocks;
}

/**
 * Prefers the structured document and falls back to the uploaded text, so a
 * freshly uploaded resume and a hand-built one both analyse.
 */
export function blocksFromResume(resume: ResumeRecord): TextBlock[] {
  const structured = blocksFromDocument(resume);

  // One lone profile block means nothing has been filled in yet — the upload's
  // own text is the better source.
  if (structured.filter((block) => block.kind !== "profile").length > 0) {
    return structured;
  }

  const raw = blocksFromRawText(resume.rawText);
  return raw.length > 0 ? [...structured, ...raw] : structured;
}

export function serializeBlocks(blocks: TextBlock[]): string {
  return blocks.map((block) => `[${block.id}] ${block.text}`).join("\n");
}

/**
 * Counted locally rather than asked of the model: we know exactly how many
 * bullet blocks we sent, so the denominator of the quantified-bullet ratio
 * never depends on the model counting correctly.
 */
export function countBullets(blocks: TextBlock[]): number {
  return blocks.filter((block) => block.kind === "bullet").length;
}

export function blockIndex(blocks: TextBlock[]): Map<string, TextBlock> {
  return new Map(blocks.map((block) => [block.id, block]));
}
