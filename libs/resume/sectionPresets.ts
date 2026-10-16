import type { SectionLayout } from "./resumeSchema";

export type PresetGroup = "Core" | "Experience" | "Credentials" | "Extras";

export const PRESET_GROUPS: PresetGroup[] = [
  "Core",
  "Experience",
  "Credentials",
  "Extras",
];

export interface TimelineLabels {
  title: string;
  subtitle: string;
  /** Absent means the section has no meta field. */
  meta?: string;
  /** Absent means the section has no description field. */
  description?: string;
  /** Absent means the section has no link field. */
  url?: string;
  addLabel: string;
}

export interface SkillsLabels {
  group: string;
  items: string;
  addLabel: string;
}

export interface SimpleLabels {
  field: string;
  placeholder: string;
}

interface PresetBase {
  id: string;
  heading: string;
  hint: string;
  group: PresetGroup;
}

export type TimelinePreset = PresetBase & {
  layout: "timeline";
  labels: TimelineLabels;
};
export type SkillsPreset = PresetBase & {
  layout: "skills";
  labels: SkillsLabels;
};
export type TextPreset = PresetBase & { layout: "text"; labels: SimpleLabels };
export type ListPreset = PresetBase & { layout: "list"; labels: SimpleLabels };

export type SectionPreset =
  | TimelinePreset
  | SkillsPreset
  | TextPreset
  | ListPreset;

interface PresetByLayout {
  timeline: TimelinePreset;
  skills: SkillsPreset;
  text: TextPreset;
  list: ListPreset;
}

export const LAYOUT_LABELS: Record<SectionLayout, string> = {
  timeline: "Dated entries",
  skills: "Grouped skills",
  text: "Paragraph",
  list: "Bullet list",
};

export const SECTION_PRESETS: SectionPreset[] = [
  {
    id: "summary",
    heading: "Summary",
    hint: "A two or three line pitch at the top of the page.",
    group: "Core",
    layout: "text",
    labels: {
      field: "Summary",
      placeholder:
        "Frontend engineer with six years building design systems and data-heavy dashboards.",
    },
  },
  {
    id: "experience",
    heading: "Experience",
    hint: "List relevant jobs and key accomplishments.",
    group: "Core",
    layout: "timeline",
    labels: {
      title: "Company",
      subtitle: "Role",
      meta: "Location / type",
      addLabel: "Add experience",
    },
  },
  {
    id: "work-experience",
    heading: "Work Experience",
    hint: "Same fields as Experience, under the heading some recruiters expect.",
    group: "Core",
    layout: "timeline",
    labels: {
      title: "Company",
      subtitle: "Role",
      meta: "Location / type",
      addLabel: "Add experience",
    },
  },
  {
    id: "education",
    heading: "Education",
    hint: "Include degrees, schools, and graduation years.",
    group: "Core",
    layout: "timeline",
    labels: {
      title: "School",
      subtitle: "Program",
      meta: "Credential / GPA",
      addLabel: "Add education",
    },
  },
  {
    id: "your-highlight",
    heading: "Your Highlight",
    hint: "Work and tasks worth calling out, as bullet points.",
    group: "Core",
    layout: "list",
    labels: {
      field: "Highlights (one per line)",
      placeholder:
        "Shipped the billing rewrite\nRan the on-call rotation for 18 engineers",
    },
  },
  {
    id: "skills",
    heading: "Skills",
    hint: "Add your main skills for recruiters to see at a glance.",
    group: "Core",
    layout: "skills",
    labels: {
      group: "Group",
      items: "Skills (comma separated)",
      addLabel: "Add skill group",
    },
  },
  {
    id: "technical-skills",
    heading: "Technical Skills",
    hint: "Languages, frameworks and tooling, grouped.",
    group: "Core",
    layout: "skills",
    labels: {
      group: "Group",
      items: "Skills (comma separated)",
      addLabel: "Add skill group",
    },
  },
  {
    id: "projects",
    heading: "Projects",
    hint: "Projects you have worked on.",
    group: "Experience",
    layout: "timeline",
    labels: {
      title: "Project",
      subtitle: "Role / context",
      description: "Description",
      url: "Link",
      addLabel: "Add project",
    },
  },
  {
    id: "internships",
    heading: "Internships",
    hint: "Useful early in a career, or alongside study.",
    group: "Experience",
    layout: "timeline",
    labels: {
      title: "Company",
      subtitle: "Role",
      meta: "Location / type",
      addLabel: "Add internship",
    },
  },
  {
    id: "volunteering",
    heading: "Volunteering",
    hint: "Unpaid work that still shows relevant skills.",
    group: "Experience",
    layout: "timeline",
    labels: {
      title: "Organisation",
      subtitle: "Role",
      meta: "Location / type",
      addLabel: "Add volunteering",
    },
  },
  {
    id: "leadership",
    heading: "Leadership",
    hint: "Societies, committees and teams you led.",
    group: "Experience",
    layout: "timeline",
    labels: {
      title: "Organisation",
      subtitle: "Role",
      meta: "Scope",
      addLabel: "Add role",
    },
  },
  {
    id: "certificates",
    heading: "Certificates",
    hint: "Certifications earned.",
    group: "Credentials",
    layout: "timeline",
    labels: {
      title: "Certificate",
      subtitle: "Issuer",
      meta: "Credential ID",
      url: "Link",
      addLabel: "Add certificate",
    },
  },
  {
    id: "courses",
    heading: "Courses & Training",
    hint: "Short courses and training that back up your skills.",
    group: "Credentials",
    layout: "timeline",
    labels: {
      title: "Course",
      subtitle: "Provider",
      meta: "Completed",
      addLabel: "Add course",
    },
  },
  {
    id: "awards",
    heading: "Awards & Honors",
    hint: "Recognition worth a line of its own.",
    group: "Credentials",
    layout: "timeline",
    labels: {
      title: "Award",
      subtitle: "Issuer",
      meta: "Context",
      addLabel: "Add award",
    },
  },
  {
    id: "publications",
    heading: "Publications",
    hint: "Papers, articles and talks.",
    group: "Credentials",
    layout: "timeline",
    labels: {
      title: "Title",
      subtitle: "Publisher",
      meta: "Authors",
      addLabel: "Add publication",
    },
  },
  {
    id: "languages",
    heading: "Languages",
    hint: "Group languages by how well you speak them.",
    group: "Extras",
    layout: "skills",
    labels: {
      group: "Level",
      items: "Languages (comma separated)",
      addLabel: "Add level",
    },
  },
  {
    id: "achievements",
    heading: "Achievements",
    hint: "Standalone wins that do not belong to one job.",
    group: "Extras",
    layout: "list",
    labels: {
      field: "Achievements (one per line)",
      placeholder:
        "Spoke at ReactConf 2024\nMaintainer of a library with 1.2k stars",
    },
  },
  {
    id: "interests",
    heading: "Interests",
    hint: "A short, human line at the foot of the page.",
    group: "Extras",
    layout: "list",
    labels: {
      field: "Interests (one per line)",
      placeholder: "Trail running\nFilm photography",
    },
  },
  {
    id: "references",
    heading: "References",
    hint: "Names and contacts, or a note that they are on request.",
    group: "Extras",
    layout: "text",
    labels: {
      field: "References",
      placeholder: "Available on request.",
    },
  },
];

export const CUSTOM_PRESETS: PresetByLayout = {
  timeline: {
    id: "custom-timeline",
    heading: "New section",
    hint: "Dated entries with optional bullets.",
    group: "Extras",
    layout: "timeline",
    labels: {
      title: "Title",
      subtitle: "Subtitle",
      meta: "Detail",
      addLabel: "Add entry",
    },
  },
  skills: {
    id: "custom-skills",
    heading: "New section",
    hint: "Named groups of comma-separated items.",
    group: "Extras",
    layout: "skills",
    labels: {
      group: "Group",
      items: "Items (comma separated)",
      addLabel: "Add group",
    },
  },
  text: {
    id: "custom-text",
    heading: "New section",
    hint: "A single paragraph.",
    group: "Extras",
    layout: "text",
    labels: { field: "Content", placeholder: "" },
  },
  list: {
    id: "custom-list",
    heading: "New section",
    hint: "A plain list of lines.",
    group: "Extras",
    layout: "list",
    labels: { field: "Items (one per line)", placeholder: "" },
  },
};

export const DEFAULT_SECTION_PRESET_IDS = [
  "education",
  "experience",
  "skills",
];


export function getSectionPreset(
  id: string,
  layout: SectionLayout = "timeline",
): SectionPreset {
  return findPreset(id) ?? CUSTOM_PRESETS[layout];
}

export function presetForLayout<L extends SectionLayout>(
  id: string,
  layout: L,
): PresetByLayout[L] {
  const found = findPreset(id);

  return (
    found?.layout === layout ? found : CUSTOM_PRESETS[layout]
  ) as PresetByLayout[L];
}

function findPreset(id: string): SectionPreset | undefined {
  return (
    SECTION_PRESETS.find((preset) => preset.id === id) ??
    Object.values(CUSTOM_PRESETS).find((preset) => preset.id === id)
  );
}
