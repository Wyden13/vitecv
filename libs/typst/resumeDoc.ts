import {
  contactLines,
  formatDateRange,
  linkText,
  skillItems,
  urlHref,
  urlText,
  visibleBullets,
  visibleEntries,
  visibleLinks,
  visibleListItems,
  visibleSections,
  visibleSkillGroups,
} from "@/components/resume/templates/shared";
import type { ResumeDocument, ResumeSection } from "@/libs/resume/resumeSchema";
import { toTypstTheme, type TypstTheme } from "./theme";

/**
 * The JSON a résumé template receives (`render(data)` in
 * public/typst/templates/resume/*.typ). This is the only place a résumé is
 * shaped for Typst: empty entries, bullets and sections are dropped, dates
 * are formatted and links resolved here, so templates are pure styling.
 * Every field is a string or array — never null or missing.
 */
export interface TypstResumeDoc {
  theme: TypstTheme;
  profile: {
    name: string;
    title: string;
    contact: string[];
    links: { text: string; href: string }[];
  };
  sections: TypstResumeSection[];
}

export interface TypstTimelineEntry {
  title: string;
  subtitle: string;
  meta: string;
  dates: string;
  description: string;
  url_text: string;
  url_href: string;
  bullets: string[];
}

export interface TypstResumeSection {
  heading: string;
  layout: ResumeSection["layout"];
  entries: TypstTimelineEntry[];
  groups: { group: string; items: string }[];
  body: string;
  items: string[];
}

function toSection(section: ResumeSection): TypstResumeSection {
  const out: TypstResumeSection = {
    heading: section.heading,
    layout: section.layout,
    entries: [],
    groups: [],
    body: "",
    items: [],
  };

  switch (section.layout) {
    case "timeline":
      out.entries = visibleEntries(section.entries).map((entry) => {
        const url = entry.url.trim();
        return {
          title: entry.title,
          subtitle: entry.subtitle.trim(),
          meta: entry.meta,
          dates: formatDateRange(entry),
          description: entry.description.trim(),
          url_text: url ? urlText(url) : "",
          url_href: url ? urlHref(url) : "",
          bullets: visibleBullets(entry),
        };
      });
      break;
    case "skills":
      out.groups = visibleSkillGroups(section.groups).map((group) => ({
        group: group.group,
        items: skillItems(group),
      }));
      break;
    case "text":
      out.body = section.body.trim();
      break;
    case "list":
      out.items = visibleListItems(section.items);
      break;
  }

  return out;
}

export function toTypstResume(document: ResumeDocument): TypstResumeDoc {
  const { profile } = document;

  return {
    theme: toTypstTheme(document.theme),
    profile: {
      name: profile.name || "Your name",
      title: profile.title,
      contact: contactLines(profile),
      links: visibleLinks(profile).map((link) => ({
        text: linkText(link),
        href: link.url.trim() ? urlHref(link.url) : "",
      })),
    },
    sections: visibleSections(document.sections).map(toSection),
  };
}
