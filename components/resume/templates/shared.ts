import type {
  ProfileLink,
  ResumeProfile,
  ResumeSection,
  SkillGroup,
  TimelineEntry,
} from "@/libs/resume/resumeSchema";

/**
 * Content rules every resume template shares.
 *
 * Templates differ in layout, not in what counts as worth printing — a blank
 * bullet or an empty skill group should vanish from all of them. Keeping these
 * here means a fix lands everywhere at once.
 */

export function formatDateRange(entry: TimelineEntry): string {
  return [entry.start, entry.end].filter(Boolean).join(" – ");
}

export function visibleBullets(entry: TimelineEntry): string[] {
  return entry.bullets.filter((bullet) => bullet.trim());
}

/** Drops entries the user added but never filled in. */
export function visibleEntries(entries: TimelineEntry[]): TimelineEntry[] {
  return entries.filter(
    (entry) =>
      entry.title.trim() ||
      entry.subtitle.trim() ||
      entry.meta.trim() ||
      formatDateRange(entry) ||
      visibleBullets(entry).length > 0,
  );
}

/** A group earns its heading if it is named or holds at least one skill. */
export function visibleSkillGroups(groups: SkillGroup[]): SkillGroup[] {
  return groups.filter(
    (group) => group.group.trim() || group.items.some((item) => item.trim()),
  );
}

export function skillItems(group: SkillGroup): string {
  return group.items.filter(Boolean).join(", ");
}

export function contactLines(profile: ResumeProfile): string[] {
  return [profile.email, profile.phone, profile.location].filter(Boolean);
}

export function visibleLinks(profile: ResumeProfile): ProfileLink[] {
  return profile.links.filter((link) => link.url || link.label);
}

export function linkText(link: ProfileLink): string {
  return link.label || link.url;
}

/** Drops the blank lines a one-per-line editor leaves behind. */
export function visibleListItems(items: string[]): string[] {
  return items.filter((item) => item.trim());
}

export function sectionHasContent(section: ResumeSection): boolean {
  switch (section.layout) {
    case "timeline":
      return visibleEntries(section.entries).length > 0;
    case "skills":
      return visibleSkillGroups(section.groups).length > 0;
    case "text":
      return Boolean(section.body.trim());
    case "list":
      return visibleListItems(section.items).length > 0;
  }
}

export function visibleSections(sections: ResumeSection[]): ResumeSection[] {
  return sections.filter(sectionHasContent);
}
