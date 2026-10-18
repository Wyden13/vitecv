import type {
  ProfileLink,
  ResumeProfile,
  ResumeSection,
  SkillGroup,
  TimelineEntry,
} from "@/libs/resume/resumeSchema";

export function formatDateRange(entry: TimelineEntry): string {
  return [entry.start, entry.end].filter(Boolean).join(" – ");
}

export function visibleBullets(entry: TimelineEntry): string[] {
  return entry.bullets.filter((bullet) => bullet.trim());
}
export function visibleEntries(entries: TimelineEntry[]): TimelineEntry[] {
  return entries.filter(
    (entry) =>
      entry.title.trim() ||
      entry.subtitle.trim() ||
      entry.meta.trim() ||
      entry.description.trim() ||
      entry.url.trim() ||
      formatDateRange(entry) ||
      visibleBullets(entry).length > 0,
  );
}

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
  return link.label || urlText(link.url);
}

/** remove "https://" */
export function urlText(url: string): string {
  return url
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/\/$/, "");
}

/**
 * Authors type "github.com/me/thing" as often as the full URL, and a bare host
 * in an href resolves against the app instead of leaving it.
 */
export function urlHref(url: string): string {
  const trimmed = url.trim();
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

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
