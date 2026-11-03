import {
  visibleEntries,
  visibleSections,
} from "@/components/resume/templates/shared";
import {
  createSection,
  createSkillGroup,
  type ResumeDocument,
} from "@/libs/resume/resumeSchema";
import { getSectionPreset } from "@/libs/resume/sectionPresets";

/**
 * Pure document transforms behind the agent's resume tools, in the same shape
 * as `libs/library/libraryPull.ts`: no React and no Firebase, because the
 * caller already owns the document and its write path.
 *
 * Every transform reports *why* it could not run rather than returning null,
 * so the confirm card can say "already in your skills" instead of the much
 * less useful "could not apply".
 */

/**
 * - `missing`   — the place it should land is not in the document
 * - `changed`   — the text it was written against has since been edited
 * - `redundant` — it is already there; applying would duplicate
 * - `invalid`   — the arguments do not describe a usable change
 */
export type TransformFailure =
  | "missing"
  | "changed"
  | "redundant"
  | "invalid";

export type TransformResult =
  | { ok: true; document: ResumeDocument }
  | { ok: false; reason: TransformFailure };

export interface EntryTarget {
  sectionId: string;
  entryId: string;
}

const ENTRY_BLOCK = /^s(\d+)-e(\d+)$/;

/**
 * Entry-level addressing, kept separate from `resolveBlockTarget`.
 *
 * That resolver deliberately refuses `s3-e1`, because an entry's block text is
 * a composite join with no single writable field. Appending a bullet is a
 * different operation on the same address, so it gets its own resolver rather
 * than loosening refusals that are load-bearing elsewhere.
 */
export function resolveEntryTarget(
  document: ResumeDocument,
  blockId: string,
): EntryTarget | null {
  const match = ENTRY_BLOCK.exec(blockId);
  if (!match) return null;

  const section = visibleSections(document.sections)[Number(match[1]) - 1];
  if (section?.layout !== "timeline") return null;

  const entry = visibleEntries(section.entries)[Number(match[2]) - 1];
  if (!entry) return null;

  return { sectionId: section.id, entryId: entry.id };
}

export function addBullet(
  document: ResumeDocument,
  target: EntryTarget,
  bullet: string,
): TransformResult {
  const line = bullet.trim();
  if (!line) return { ok: false, reason: "invalid" };

  let found = false;
  let duplicate = false;

  const sections = document.sections.map((section) => {
    if (section.id !== target.sectionId || section.layout !== "timeline") {
      return section;
    }

    return {
      ...section,
      entries: section.entries.map((entry) => {
        if (entry.id !== target.entryId) return entry;

        found = true;

        if (entry.bullets.some((row) => row.trim() === line)) {
          duplicate = true;
          return entry;
        }

        return { ...entry, bullets: [...entry.bullets, line] };
      }),
    };
  });

  if (!found) return { ok: false, reason: "missing" };
  if (duplicate) return { ok: false, reason: "redundant" };

  return { ok: true, document: { ...document, sections } };
}

/**
 * Adds a skill to a named group, creating the group — and the Skills section
 * itself — when they are not there yet. A resume with no Skills section is the
 * common case for the very request this tool answers ("add React"), so
 * refusing it would be refusing the point.
 */
export function addSkill(
  document: ResumeDocument,
  group: string,
  skill: string,
): TransformResult {
  const name = group.trim();
  const item = skill.trim();
  if (!name || !item) return { ok: false, reason: "invalid" };

  const lower = item.toLowerCase();
  const alreadyListed = document.sections.some(
    (section) =>
      section.layout === "skills" &&
      section.groups.some((entry) =>
        entry.items.some((value) => value.trim().toLowerCase() === lower),
      ),
  );

  // Checked across every group, not just the target one: the gap analysis
  // suggests terms without knowing where they already sit, and listing
  // "React" twice under two headings is worse than not adding it.
  if (alreadyListed) return { ok: false, reason: "redundant" };

  const hasSkills = document.sections.some(
    (section) => section.layout === "skills",
  );

  if (!hasSkills) {
    const section = createSection(getSectionPreset("technical-skills", "skills"));

    if (section.layout !== "skills") return { ok: false, reason: "missing" };

    return {
      ok: true,
      document: {
        ...document,
        sections: [
          ...document.sections,
          // `createSection` seeds one blank group; fill it rather than
          // leaving an empty row above the new one.
          { ...section, groups: [{ ...createSkillGroup(), group: name, items: [item] }] },
        ],
      },
    };
  }

  let placed = false;

  const sections = document.sections.map((section) => {
    if (placed || section.layout !== "skills") return section;

    const matchIndex = section.groups.findIndex(
      (entry) => entry.group.trim().toLowerCase() === name.toLowerCase(),
    );

    if (matchIndex >= 0) {
      placed = true;
      return {
        ...section,
        groups: section.groups.map((entry, index) =>
          index === matchIndex
            ? { ...entry, items: [...entry.items, item] }
            : entry,
        ),
      };
    }

    // No group by that name — reuse a blank placeholder row if the section has
    // one, otherwise append a new group.
    const blankIndex = section.groups.findIndex(
      (entry) => !entry.group.trim() && entry.items.every((value) => !value.trim()),
    );

    placed = true;

    if (blankIndex >= 0) {
      return {
        ...section,
        groups: section.groups.map((entry, index) =>
          index === blankIndex ? { ...entry, group: name, items: [item] } : entry,
        ),
      };
    }

    return {
      ...section,
      groups: [...section.groups, { ...createSkillGroup(), group: name, items: [item] }],
    };
  });

  if (!placed) return { ok: false, reason: "missing" };

  return { ok: true, document: { ...document, sections } };
}
