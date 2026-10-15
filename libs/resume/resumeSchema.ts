import {
  DEFAULT_THEME,
  normalizeTheme,
  type DocumentTheme,
} from "../templateTheme";
import {
  CUSTOM_PRESETS,
  DEFAULT_SECTION_PRESET_IDS,
  getSectionPreset,
  type SectionPreset,
} from "./sectionPresets";

export type SectionLayout = "timeline" | "skills" | "text" | "list";

export const SECTION_LAYOUTS: SectionLayout[] = [
  "timeline",
  "skills",
  "text",
  "list",
];

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

interface SectionBase {
  id: string;
  heading: string;
  presetId: string;
}

export interface TimelineSection extends SectionBase {
  layout: "timeline";
  entries: TimelineEntry[];
}

export interface SkillsSection extends SectionBase {
  layout: "skills";
  groups: SkillGroup[];
}

export interface TextSection extends SectionBase {
  layout: "text";
  body: string;
}

export interface ListSection extends SectionBase {
  layout: "list";
  items: string[];
}

export type ResumeSection =
  | TimelineSection
  | SkillsSection
  | TextSection
  | ListSection;

export interface ResumeDocument {
  profile: ResumeProfile;
  sections: ResumeSection[];
  templateId: ResumeTemplateId;
  theme: DocumentTheme;
}

/** Stable-enough ids for list keys and reordering; not a security boundary. */
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

export function createSection(
  preset: SectionPreset,
  heading?: string,
): ResumeSection {
  const base = {
    id: createId(),
    heading: heading?.trim() || preset.heading,
    presetId: preset.id,
  };

  switch (preset.layout) {
    case "timeline":
      return { ...base, layout: "timeline", entries: [createTimelineEntry()] };
    case "skills":
      return { ...base, layout: "skills", groups: [createSkillGroup()] };
    case "text":
      return { ...base, layout: "text", body: "" };
    case "list":
      return { ...base, layout: "list", items: [] };
  }
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
    sections: DEFAULT_SECTION_PRESET_IDS.map((id) =>
      createSection(getSectionPreset(id)),
    ),
    templateId: DEFAULT_RESUME_TEMPLATE,
    theme: { ...DEFAULT_THEME },
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeTimelineEntry(value: unknown): TimelineEntry {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    id: text(raw.id) || createId(),
    title: text(raw.title),
    subtitle: text(raw.subtitle),
    meta: text(raw.meta),
    start: text(raw.start),
    end: text(raw.end),
    bullets: textList(raw.bullets),
  };
}

function normalizeSkillGroup(value: unknown): SkillGroup {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    id: text(raw.id) || createId(),
    group: text(raw.group),
    items: textList(raw.items),
  };
}

function normalizeSection(value: unknown): ResumeSection | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const layout = SECTION_LAYOUTS.find((candidate) => candidate === raw.layout);
  if (!layout) return null;

  const presetId = text(raw.presetId) || CUSTOM_PRESETS[layout].id;
  const base = {
    id: text(raw.id) || createId(),
    heading:
      typeof raw.heading === "string"
        ? raw.heading
        : getSectionPreset(presetId, layout).heading,
    presetId,
  };

  switch (layout) {
    case "timeline":
      return {
        ...base,
        layout,
        entries: Array.isArray(raw.entries)
          ? raw.entries.map(normalizeTimelineEntry)
          : [],
      };
    case "skills":
      return {
        ...base,
        layout,
        groups: Array.isArray(raw.groups)
          ? raw.groups.map(normalizeSkillGroup)
          : [],
      };
    case "text":
      return { ...base, layout, body: text(raw.body) };
    case "list":
      return { ...base, layout, items: textList(raw.items) };
  }
}

type LegacyKind =
  | "education"
  | "skills"
  | "experience"
  | "projects"
  | "certificates";

interface LegacyResumeDocument {
  sectionOrder?: unknown;
  education?: unknown;
  skills?: unknown;
  experience?: unknown;
  projects?: unknown;
  certificates?: unknown;
}

const LEGACY_KINDS: LegacyKind[] = [
  "education",
  "skills",
  "experience",
  "projects",
  "certificates",
];

const LEGACY_PRESETS: Record<LegacyKind, { presetId: string; heading: string }> =
{
  education: { presetId: "education", heading: "Education" },
  skills: { presetId: "technical-skills", heading: "Technical Skills" },
  experience: { presetId: "experience", heading: "Experience" },
  projects: { presetId: "projects", heading: "Projects" },
  certificates: { presetId: "certificates", heading: "Certificates" },
};

const LEGACY_KEEP_EMPTY: LegacyKind[] = ["education", "experience", "skills"];

function legacySection(kind: LegacyKind, stored: unknown): ResumeSection {
  const { presetId, heading } = LEGACY_PRESETS[kind];
  const rows = Array.isArray(stored) ? stored : [];
  const base = { id: createId(), heading, presetId };

  return kind === "skills"
    ? { ...base, layout: "skills", groups: rows.map(normalizeSkillGroup) }
    : { ...base, layout: "timeline", entries: rows.map(normalizeTimelineEntry) };
}

function sectionsFromLegacy(value: LegacyResumeDocument): ResumeSection[] {
  const stored = Array.isArray(value.sectionOrder)
    ? value.sectionOrder.filter((kind): kind is LegacyKind =>
      LEGACY_KINDS.includes(kind as LegacyKind),
    )
    : [];
  const kinds = [
    ...stored,
    ...LEGACY_KINDS.filter((kind) => !stored.includes(kind)),
  ];

  return kinds
    .map((kind) => ({ kind, section: legacySection(kind, value[kind]) }))
    .filter(({ kind, section }) => {
      const rows =
        section.layout === "skills" ? section.groups : section.layout === "timeline" ? section.entries : [];

      return rows.length > 0 || LEGACY_KEEP_EMPTY.includes(kind);
    })
    .map(({ section }) => section);
}

export function normalizeResumeDocument(
  value:
    | (Partial<ResumeDocument> & LegacyResumeDocument)
    | undefined
    | null,
): ResumeDocument {
  const base = createEmptyResumeDocument();
  if (!value) return base;

  const sections = Array.isArray(value.sections)
    ? value.sections
      .map(normalizeSection)
      .filter((section): section is ResumeSection => section !== null)
    : sectionsFromLegacy(value);

  return {
    profile: { ...base.profile, ...value.profile },
    sections,
    templateId:
      value.templateId && RESUME_TEMPLATE_IDS.includes(value.templateId)
        ? value.templateId
        : DEFAULT_RESUME_TEMPLATE,
    theme: normalizeTheme(value.theme),
  };
}
