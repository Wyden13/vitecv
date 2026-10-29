import {
  createId,
  createSkillGroup,
  createTimelineEntry,
  normalizeSkillGroup,
  normalizeTimelineEntry,
  SECTION_LAYOUTS,
  type ResumeSection,
  type SectionLayout,
  type SkillGroup,
  type TimelineEntry,
} from "@/libs/resume/resumeSchema";
import { CUSTOM_PRESETS, getSectionPreset } from "@/libs/resume/sectionPresets";

/**
 * The library stores career facts in exactly the shape a resume section already
 * uses, so handing an item to a document is a copy rather than a conversion: a
 * library section *is* a section preset, and a library item is one
 * `TimelineEntry` / `SkillGroup` / paragraph / line list belonging to it. That
 * is also where the edit form's field labels come from — see `toResumeSection`
 * at the foot of this file for the read path the document editors use.
 */

/** Not an item section: the profile is a single document, edited in place. */
export const PROFILE_SECTION_KEY = "profile";

/**
 * Built-in sections are config, not data — each key is a `SECTION_PRESETS` id,
 * so headings and hints come from the preset and there is nothing to seed on a
 * user's first visit.
 */
export const LIBRARY_BUILTIN_SECTION_KEYS = [
  "work-experience",
  "education",
  "skills",
  "certificates",
];

/**
 * Presets that name the same thing on either side of the library. A resume
 * created from scratch gets the "experience" preset while the library's
 * built-in section is "work-experience", so without this a pull would add a
 * second Experience heading instead of filling the one already there.
 */
const EQUIVALENT_PRESET_IDS: string[][] = [
  ["work-experience", "experience"],
  ["skills", "technical-skills"],
];

export function presetIdsMatch(a: string, b: string): boolean {
  if (a === b) return true;

  return EQUIVALENT_PRESET_IDS.some(
    (group) => group.includes(a) && group.includes(b),
  );
}

/** The built-in library section a resume preset belongs to, if any. */
export function libraryKeyForPreset(presetId: string): string | null {
  return (
    LIBRARY_BUILTIN_SECTION_KEYS.find((key) => presetIdsMatch(key, presetId)) ??
    null
  );
}

export interface LibrarySectionMeta {
  id: string;
  heading: string;
  presetId: string;
  layout: SectionLayout;
  order: number;
}

export type LibrarySectionInput = Omit<LibrarySectionMeta, "id">;

/** What the nav and the detail pane render, built-in or custom alike. */
export interface LibrarySectionDescriptor {
  /** A built-in preset id, or a custom section's document id. */
  key: string;
  presetId: string;
  layout: SectionLayout;
  heading: string;
  hint: string;
  custom: boolean;
}

interface LibraryItemBase {
  id: string;
  sectionKey: string;
  order: number;
  updatedAt: Date | null;
}

export interface TimelineLibraryItem extends LibraryItemBase {
  layout: "timeline";
  entry: TimelineEntry;
}

export interface SkillsLibraryItem extends LibraryItemBase {
  layout: "skills";
  group: SkillGroup;
}

export interface TextLibraryItem extends LibraryItemBase {
  layout: "text";
  body: string;
}

export interface ListLibraryItem extends LibraryItemBase {
  layout: "list";
  items: string[];
}

export type LibraryItem =
  | TimelineLibraryItem
  | SkillsLibraryItem
  | TextLibraryItem
  | ListLibraryItem;

/**
 * `Omit` collapses a union into its common keys, so distribute it across the
 * members — unlike `JobApplicationInput`, which omits from a plain interface.
 */
type WithoutStored<T> = T extends unknown ? Omit<T, "id" | "updatedAt"> : never;

export type LibraryItemInput = WithoutStored<LibraryItem>;

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function builtinSectionDescriptors(): LibrarySectionDescriptor[] {
  return LIBRARY_BUILTIN_SECTION_KEYS.map((key) => {
    const preset = getSectionPreset(key);

    return {
      key,
      presetId: preset.id,
      layout: preset.layout,
      heading: preset.heading,
      hint: preset.hint,
      custom: false,
    };
  });
}

export function customSectionDescriptor(
  section: LibrarySectionMeta,
): LibrarySectionDescriptor {
  const preset = getSectionPreset(section.presetId, section.layout);

  return {
    key: section.id,
    presetId: section.presetId,
    layout: section.layout,
    heading: section.heading.trim() || preset.heading,
    hint: preset.hint,
    custom: true,
  };
}

export function createEmptyLibrarySection(
  layout: SectionLayout,
  order: number,
): LibrarySectionInput {
  return {
    heading: "",
    presetId: CUSTOM_PRESETS[layout].id,
    layout,
    order,
  };
}

export function createEmptyLibraryItem(
  section: LibrarySectionDescriptor,
  order: number,
): LibraryItemInput {
  const base = { sectionKey: section.key, order };

  switch (section.layout) {
    case "timeline":
      return { ...base, layout: "timeline", entry: createTimelineEntry() };
    case "skills":
      return { ...base, layout: "skills", group: createSkillGroup() };
    case "text":
      return { ...base, layout: "text", body: "" };
    case "list":
      return { ...base, layout: "list", items: [] };
  }
}

export function normalizeLibrarySection(
  id: string,
  value: unknown,
): LibrarySectionMeta | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const layout = SECTION_LAYOUTS.find((candidate) => candidate === raw.layout);
  if (!layout) return null;

  return {
    id,
    heading: text(raw.heading),
    presetId: text(raw.presetId) || CUSTOM_PRESETS[layout].id,
    layout,
    order: num(raw.order),
  };
}

/**
 * An item whose layout or section is unreadable is dropped by the caller, the
 * way `normalizeSection` drops an unrecognised resume section. Note this does
 * not run `rehomeMeta`: the edit sheet only ever writes the fields its preset
 * declares, and the resume path re-normalizes anyway once an item lands in a
 * document.
 */
export function normalizeLibraryItem(
  id: string,
  value: unknown,
  updatedAt: Date | null,
): LibraryItem | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const layout = SECTION_LAYOUTS.find((candidate) => candidate === raw.layout);
  if (!layout) return null;

  const sectionKey = text(raw.sectionKey);
  if (!sectionKey) return null;

  const base = { id, sectionKey, order: num(raw.order), updatedAt };

  switch (layout) {
    case "timeline":
      return { ...base, layout, entry: normalizeTimelineEntry(raw.entry) };
    case "skills":
      return { ...base, layout, group: normalizeSkillGroup(raw.group) };
    case "text":
      return { ...base, layout, body: text(raw.body) };
    case "list":
      return { ...base, layout, items: textList(raw.items) };
  }
}

/**
 * Items arrive from Firestore already sorted by `order`, so each bucket keeps
 * the user's chosen sequence without a second sort.
 */
export function groupLibraryItems(
  items: LibraryItem[],
): Map<string, LibraryItem[]> {
  const grouped = new Map<string, LibraryItem[]>();

  for (const item of items) {
    const bucket = grouped.get(item.sectionKey);
    if (bucket) bucket.push(item);
    else grouped.set(item.sectionKey, [item]);
  }

  return grouped;
}

const UNTITLED = "Untitled";

export interface LibraryItemLabel {
  title: string;
  meta: string;
}

export function libraryItemLabel(item: LibraryItem): LibraryItemLabel {
  switch (item.layout) {
    case "timeline": {
      const { entry } = item;
      const title = entry.title.trim();
      const subtitle = entry.subtitle.trim();
      const dates = [entry.start, entry.end]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" — ");

      return {
        title: title || subtitle || UNTITLED,
        // When the title fell back to the subtitle, do not repeat it below.
        meta: [title ? subtitle : "", entry.meta.trim(), dates]
          .filter(Boolean)
          .join(" · "),
      };
    }

    case "skills": {
      const { group } = item;

      return {
        title: group.group.trim() || UNTITLED,
        meta: group.items
          .map((entry) => entry.trim())
          .filter(Boolean)
          .join(", "),
      };
    }

    case "text": {
      const body = item.body.trim();
      const [firstLine = ""] = body.split("\n");

      return {
        title: firstLine.slice(0, 80) || UNTITLED,
        meta: firstLine.length > 80 ? "…" : "",
      };
    }

    case "list": {
      const lines = item.items.map((entry) => entry.trim()).filter(Boolean);

      return {
        title: lines[0] ?? UNTITLED,
        meta: lines.length > 1 ? `+${lines.length - 1} more` : "",
      };
    }
  }
}

/**
 * Whether an item carries anything worth saving. Drives the sheet's disabled
 * Save button and skips blank entries when importing from a resume.
 */
export function libraryItemHasContent(input: LibraryItemInput): boolean {
  switch (input.layout) {
    case "timeline":
      return Boolean(
        input.entry.title.trim() ||
          input.entry.subtitle.trim() ||
          input.entry.bullets.some((bullet) => bullet.trim()),
      );
    case "skills":
      return Boolean(
        input.group.group.trim() ||
          input.group.items.some((entry) => entry.trim()),
      );
    case "text":
      return Boolean(input.body.trim());
    case "list":
      return input.items.some((entry) => entry.trim());
  }
}

/**
 * The read path for the resume and cover-letter editors: collapse a library
 * section's items back into a single `ResumeSection` ready to drop into a
 * document. Items whose layout disagrees with the section are skipped rather
 * than coerced.
 */
export function toResumeSection(
  section: LibrarySectionDescriptor,
  items: LibraryItem[],
): ResumeSection {
  const base = {
    id: createId(),
    heading: section.heading,
    presetId: section.presetId,
  };

  switch (section.layout) {
    case "timeline":
      return {
        ...base,
        layout: "timeline",
        entries: items.flatMap((item) =>
          item.layout === "timeline" ? [item.entry] : [],
        ),
      };

    case "skills":
      return {
        ...base,
        layout: "skills",
        groups: items.flatMap((item) =>
          item.layout === "skills" ? [item.group] : [],
        ),
      };

    case "text":
      return {
        ...base,
        layout: "text",
        body: items
          .flatMap((item) => (item.layout === "text" ? [item.body.trim()] : []))
          .filter(Boolean)
          .join("\n\n"),
      };

    case "list":
      return {
        ...base,
        layout: "list",
        items: items.flatMap((item) =>
          item.layout === "list" ? item.items : [],
        ),
      };
  }
}

/** Strips the stored-only fields so an item can be fed back into the form. */
export function libraryItemToInput(item: LibraryItem): LibraryItemInput {
  const base = { sectionKey: item.sectionKey, order: item.order };

  switch (item.layout) {
    case "timeline":
      return { ...base, layout: "timeline", entry: item.entry };
    case "skills":
      return { ...base, layout: "skills", group: item.group };
    case "text":
      return { ...base, layout: "text", body: item.body };
    case "list":
      return { ...base, layout: "list", items: item.items };
  }
}
