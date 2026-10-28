import type {
  ResumeDocument,
  ResumeProfile,
  ResumeSection,
  SkillGroup,
  TimelineEntry,
} from "@/libs/resume/resumeSchema";
import {
  presetIdsMatch,
  toResumeSection,
  type LibraryItem,
  type LibrarySectionDescriptor,
} from "./librarySchema";

/**
 * Merging picked library items into a resume. Pure — no React and no Firebase:
 * the editor already holds the whole document in local state and autosaves it,
 * so a pull is just another `onChange` and needs no write of its own.
 *
 * Everything here leans on `toResumeSection`, which builds a `ResumeSection`
 * from library items. That means an append is a payload concat rather than four
 * bespoke code paths, and the cover-letter editor can reuse the same rules.
 */

export interface LibraryPick {
  section: LibrarySectionDescriptor;
  items: LibraryItem[];
}

/**
 * Payload ids already in the document, which drives the drawer's "Added" pills.
 * `toResumeSection` copies `entry` and `group` across by reference, keeping
 * their ids, and `normalizeTimelineEntry` preserves a stored id on the way back
 * out of Firestore — so this match is exact rather than fuzzy text comparison.
 *
 * Text and list items carry no id of their own and so cannot be tracked this
 * way; the drawer says as much rather than showing a pill it cannot stand behind.
 */
export function pulledPayloadIds(document: ResumeDocument): Set<string> {
  const ids = new Set<string>();

  for (const section of document.sections) {
    if (section.layout === "timeline") {
      for (const entry of section.entries) ids.add(entry.id);
    } else if (section.layout === "skills") {
      for (const group of section.groups) ids.add(group.id);
    }
  }

  return ids;
}

function isBlankEntry(entry: TimelineEntry): boolean {
  return !(
    entry.title.trim() ||
    entry.subtitle.trim() ||
    entry.meta.trim() ||
    entry.start.trim() ||
    entry.end.trim() ||
    entry.description.trim() ||
    entry.url.trim() ||
    entry.bullets.some((bullet) => bullet.trim())
  );
}

function isBlankGroup(group: SkillGroup): boolean {
  return !(group.group.trim() || group.items.some((item) => item.trim()));
}

function matchesSection(
  section: ResumeSection,
  descriptor: LibrarySectionDescriptor,
): boolean {
  if (section.layout !== descriptor.layout) return false;
  if (!presetIdsMatch(section.presetId, descriptor.presetId)) return false;

  // Every generic custom block shares one preset id, so the heading is the only
  // thing that tells two of them apart.
  return descriptor.presetId.startsWith("custom-")
    ? section.heading.trim() === descriptor.heading.trim()
    : true;
}

/**
 * `createSection` seeds a fresh timeline or skills section with one blank row,
 * and every new resume starts with blank Experience, Education and Skills
 * sections. Dropping those placeholders keeps a first pull from landing under
 * an empty entry.
 */
function appendPayload(
  target: ResumeSection,
  incoming: ResumeSection,
): ResumeSection {
  // The layouts agree here — `matchesSection` has already compared them.
  if (target.layout === "timeline" && incoming.layout === "timeline") {
    return {
      ...target,
      entries: [
        ...target.entries.filter((entry) => !isBlankEntry(entry)),
        ...incoming.entries,
      ],
    };
  }

  if (target.layout === "skills" && incoming.layout === "skills") {
    return {
      ...target,
      groups: [
        ...target.groups.filter((group) => !isBlankGroup(group)),
        ...incoming.groups,
      ],
    };
  }

  if (target.layout === "list" && incoming.layout === "list") {
    return {
      ...target,
      items: [...target.items.filter((item) => item.trim()), ...incoming.items],
    };
  }

  if (target.layout === "text" && incoming.layout === "text") {
    return {
      ...target,
      body: [target.body.trim(), incoming.body.trim()]
        .filter(Boolean)
        .join("\n\n"),
    };
  }

  return target;
}

/**
 * Appends each pick into the section it belongs to, adding that section only
 * when the resume does not already have it.
 */
export function applyLibraryPull(
  document: ResumeDocument,
  picks: LibraryPick[],
): ResumeDocument {
  let sections = document.sections;

  for (const pick of picks) {
    if (pick.items.length === 0) continue;

    const incoming = toResumeSection(pick.section, pick.items);
    const index = sections.findIndex((section) =>
      matchesSection(section, pick.section),
    );

    sections =
      index === -1
        ? [...sections, incoming]
        : sections.map((section, position) =>
            position === index ? appendPayload(section, incoming) : section,
          );
  }

  return sections === document.sections ? document : { ...document, sections };
}

const PROFILE_TEXT_FIELDS = [
  "name",
  "title",
  "email",
  "phone",
  "location",
] as const;

/**
 * Copies library values into blank profile fields only, so the action is safe
 * to run twice and never overwrites something typed for this resume. Two link
 * lists cannot be merged without guessing, so the library's links apply only
 * when the resume has none of its own.
 */
export function fillProfileBlanks(
  current: ResumeProfile,
  library: ResumeProfile,
): { profile: ResumeProfile; filled: number } {
  const profile = { ...current };
  let filled = 0;

  for (const field of PROFILE_TEXT_FIELDS) {
    if (profile[field].trim() || !library[field].trim()) continue;

    profile[field] = library[field];
    filled += 1;
  }

  if (!current.links.length && library.links.length) {
    profile.links = library.links.map((link) => ({ ...link }));
    filled += library.links.length;
  }

  return { profile, filled };
}
