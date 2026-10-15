import type {
  ProfileLink,
  ResumeProfile,
  SkillGroup,
  TimelineEntry,
} from "@/libs/resumeSchema";

/**
 * Content rules every resume template shares.
 *
 * Templates differ in layout, not in what counts as worth printing — a blank
 * bullet or an empty skill group should vanish from all of them. Keeping these
 * here means a fix lands everywhere at once.
 */

/** "Jan 2020 – Present", or one side alone, or "" when neither is filled. */
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
