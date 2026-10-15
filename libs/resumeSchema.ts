import {
  DEFAULT_THEME,
  normalizeTheme,
  type DocumentTheme,
} from "./templateTheme";

export type SectionKind =
  | "profile"
  | "education"
  | "skills"
  | "experience"
  | "projects"
  | "certificates";

export type TimelineSectionKind = Exclude<SectionKind, "profile" | "skills">;

export type ResumeTemplateId = "classic" | "modern";

export const RESUME_TEMPLATE_IDS: ResumeTemplateId[] = ["classic", "modern"];

export const DEFAULT_RESUME_TEMPLATE: ResumeTemplateId = "classic";

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
}

export interface ResumeProfile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: ProfileLink[];
}

export interface TimelineEntry {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface SkillGroup {
  id: string;
  group: string;
  items: string[];
}

export interface ResumeDocument {
  profile: ResumeProfile;
  education: TimelineEntry[];
  skills: SkillGroup[];
  experience: TimelineEntry[];
  projects: TimelineEntry[];
  certificates: TimelineEntry[];
  sectionOrder: SectionKind[];
  templateId: ResumeTemplateId;
  theme: DocumentTheme;
}

export const DEFAULT_SECTION_ORDER: SectionKind[] = [
  "profile",
  "education",
  "skills",
  "experience",
  "projects",
  "certificates",
];

export const SECTION_LABELS: Record<
  SectionKind,
  { title: string; hint: string }
> = {
  profile: {
    title: "Profile Info",
    hint: "Include email, phone & portfolio for easy employer access.",
  },
  education: {
    title: "Education",
    hint: "Include degrees, schools, and graduation years.",
  },
  skills: {
    title: "Technical Skills",
    hint: "Add your main skills for recruiters to see at a glance.",
  },
  experience: {
    title: "Experience",
    hint: "List relevant jobs and key accomplishments.",
  },
  projects: {
    title: "Projects",
    hint: "Projects you've worked on.",
  },
  certificates: {
    title: "Certificates",
    hint: "Certifications earned.",
  },
};

export function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createTimelineEntry(): TimelineEntry {
  return {
    id: createId(),
    title: "",
    subtitle: "",
    meta: "",
    start: "",
    end: "",
    bullets: [],
  };
}

export function createSkillGroup(): SkillGroup {
  return { id: createId(), group: "", items: [] };
}

export function createEmptyResumeDocument(): ResumeDocument {
  return {
    profile: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      links: [],
    },
    education: [],
    skills: [],
    experience: [],
    projects: [],
    certificates: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    templateId: DEFAULT_RESUME_TEMPLATE,
    theme: { ...DEFAULT_THEME },
  };
}

export function normalizeResumeDocument(
  value: Partial<ResumeDocument> | undefined | null,
): ResumeDocument {
  const base = createEmptyResumeDocument();
  if (!value) return base;

  const storedOrder = Array.isArray(value.sectionOrder)
    ? value.sectionOrder.filter((kind): kind is SectionKind =>
        DEFAULT_SECTION_ORDER.includes(kind),
      )
    : [];
  const sectionOrder = [
    ...storedOrder,
    ...DEFAULT_SECTION_ORDER.filter((kind) => !storedOrder.includes(kind)),
  ];

  return {
    profile: { ...base.profile, ...value.profile },
    education: value.education ?? base.education,
    skills: value.skills ?? base.skills,
    experience: value.experience ?? base.experience,
    projects: value.projects ?? base.projects,
    certificates: value.certificates ?? base.certificates,
    sectionOrder,
    templateId:
      value.templateId && RESUME_TEMPLATE_IDS.includes(value.templateId)
        ? value.templateId
        : DEFAULT_RESUME_TEMPLATE,
    theme: normalizeTheme(value.theme),
  };
}
