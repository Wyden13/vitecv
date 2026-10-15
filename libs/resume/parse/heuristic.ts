import type { SectionLayout } from "@/libs/resume/resumeSchema";
import {
  CUSTOM_PRESETS,
  SECTION_PRESETS,
  getSectionPreset,
} from "@/libs/resume/sectionPresets";

import { TOKEN } from "./contacts";

/**
 * Local, no-network structuring for when GLM is unavailable (no key, timeout,
 * rate limit) or returns nothing usable. It reads headings, bullets and date
 * lines off the text and only ever slices source lines, so its output passes
 * the verbatim check by construction; layouts it misreads still end up intact
 * in "Other" via the coverage check, never lost.
 *
 * Output has the same loose shape GLM returns, so both go through
 * `normalizeParsedResume`.
 */

interface RawEntry {
  title: string;
  subtitle: string;
  meta: string;
  start: string;
  end: string;
  bullets: string[];
}

interface RawSection {
  heading: string;
  presetId: string;
  layout: SectionLayout;
  entries?: RawEntry[];
  groups?: { group: string; items: string[] }[];
  body?: string;
  items?: string[];
}

const ALIASES: Record<string, string> = {
  "professional experience": "experience",
  "work history": "experience",
  "employment history": "experience",
  employment: "experience",
  "relevant experience": "experience",
  "career history": "experience",
  profile: "summary",
  "professional summary": "summary",
  "professional profile": "summary",
  "about me": "summary",
  about: "summary",
  objective: "summary",
  "career objective": "summary",
  "summary of qualifications": "summary",
  "skills & tools": "skills",
  "skills and tools": "skills",
  "core competencies": "skills",
  "key skills": "skills",
  competencies: "skills",
  "technical skills": "technical-skills",
  "tech stack": "technical-skills",
  "academic background": "education",
  "education & training": "education",
  "education and training": "education",
  qualifications: "education",
  "personal projects": "projects",
  "selected projects": "projects",
  "side projects": "projects",
  certifications: "certificates",
  certification: "certificates",
  "licenses & certifications": "certificates",
  "licenses and certifications": "certificates",
  awards: "awards",
  honors: "awards",
  honours: "awards",
  "volunteer experience": "volunteering",
  volunteer: "volunteering",
  hobbies: "interests",
  "hobbies & interests": "interests",
  "extracurricular activities": "leadership",
  activities: "leadership",
  training: "courses",
  courses: "courses",
};

const HEADINGS = new Map<string, string>([
  ...SECTION_PRESETS.map((preset) => [preset.heading.toLowerCase(), preset.id] as [string, string]),
  ...Object.entries(ALIASES),
]);

const GLYPH = /^\s*(?:[•▪◦●○■□➢►▸‣⁃∙·]\s*|[*–—-]\s+)/;

const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?";
const DATE = `(?:${MONTH}\\s+)?(?:\\d{1,2}[/.])?(?:19|20)\\d{2}`;
const RANGE = new RegExp(
  `(${DATE})\\s*(?:[-–—]|to)\\s*(${DATE}|Present|Current|Now|Today)`,
  "i",
);
const SINGLE = new RegExp(`(?<![\\w/.])${DATE}(?![\\w/])`, "i");

function headingKey(line: string): string {
  return line.trim().replace(/[:：]$/, "").replace(/\s+/g, " ").toLowerCase();
}

/** Known heading → preset id; an unknown short ALL-CAPS line → "" (custom). */
function detectHeading(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 40 || GLYPH.test(trimmed)) return null;

  const known = HEADINGS.get(headingKey(trimmed));
  if (known) return known;

  const letters = trimmed.replace(/[^\p{L}]/gu, "");
  const isCaps =
    letters.length >= 3 &&
    letters === letters.toUpperCase() &&
    trimmed.split(/\s+/).length <= 4 &&
    !/\d/.test(trimmed);

  return isCaps ? "" : null;
}

/** Splits a line around its date, returning the non-empty sides trimmed of separators. */
function sides(line: string, match: RegExpMatchArray): string[] {
  const at = match.index ?? 0;
  return [line.slice(0, at), line.slice(at + match[0].length)]
    .map((part) => part.replace(/^[\s|,·•–—-]+|[\s|,·•–—(-]+$/g, ""))
    .filter(Boolean);
}

function emptyEntry(): RawEntry {
  return { title: "", subtitle: "", meta: "", start: "", end: "", bullets: [] };
}

/** "Acme | Engineer" or a wide gap between columns separates fields. */
const FIELD_SEPARATOR = /\s+[|·]\s+|\s{3,}/;

function fill(entry: RawEntry, text: string) {
  for (const part of text.split(FIELD_SEPARATOR).filter(Boolean)) {
    if (!entry.title) entry.title = part;
    else if (!entry.subtitle) entry.subtitle = part;
    else if (!entry.meta) entry.meta = part;
    else entry.bullets.push(part);
  }
}

function parseTimeline(lines: string[]): RawEntry[] {
  const entries: RawEntry[] = [];
  let lastWasBullet = false;

  for (const line of lines) {
    const current: RawEntry | undefined = entries[entries.length - 1];

    if (GLYPH.test(line)) {
      const target = current ?? emptyEntry();
      if (!current) entries.push(target);
      target.bullets.push(line.replace(GLYPH, "").trim());
      lastWasBullet = true;
      continue;
    }

    // A lowercase line straight after a bullet is that bullet wrapping.
    if (lastWasBullet && current && /^\s*[a-z(]/.test(line)) {
      current.bullets[current.bullets.length - 1] += ` ${line.trim()}`;
      continue;
    }

    const range = line.match(RANGE);
    const single = range ? null : line.match(SINGLE);
    const date = range ?? single;
    const dated = !!current && (!!current.start || !!current.end);

    // A new entry starts at a dated line once the current one is dated, or at
    // any line once the current one has bullets.
    let target = current;
    if (!target || target.bullets.length > 0 || (date && dated)) {
      target = emptyEntry();
      entries.push(target);
    }

    if (range) {
      target.start = range[1];
      target.end = range[2];
    } else if (single) {
      target.end = single[0];
    }

    if (date) sides(line, date).forEach((part) => fill(target, part));
    else fill(target, line.trim());

    lastWasBullet = false;
  }

  return entries;
}

function parseSkills(lines: string[]) {
  return lines.map((line) => {
    const text = line.replace(GLYPH, "").trim();
    const colon = text.indexOf(":");
    const group = colon > 0 && colon < 40 ? text.slice(0, colon).trim() : "";
    const rest = group ? text.slice(colon + 1) : text;

    return {
      group,
      items: rest.split(/[,;|•·]/).map((item) => item.trim()).filter(Boolean),
    };
  });
}

/** Bullets become items; a non-bullet line after a bullet continues it. */
function parseList(lines: string[]): string[] {
  const items: string[] = [];
  let lastWasBullet = false;

  for (const line of lines) {
    if (GLYPH.test(line)) {
      items.push(line.replace(GLYPH, "").trim());
      lastWasBullet = true;
    } else if (lastWasBullet && /^\s*[a-z(]/.test(line)) {
      items[items.length - 1] += ` ${line.trim()}`;
    } else {
      items.push(line.trim());
      lastWasBullet = false;
    }
  }

  return items;
}

/** Layout for a heading we do not recognise, guessed from its content. */
function guessLayout(lines: string[]): SectionLayout {
  if (lines.some((line) => RANGE.test(line))) return "timeline";
  if (lines.some((line) => GLYPH.test(line))) return "list";
  return "text";
}

function buildSection(heading: string, presetId: string, lines: string[]): RawSection | null {
  const content = lines.filter((line) => line.trim());
  if (!content.length) return null;

  const layout = presetId ? getSectionPreset(presetId).layout : guessLayout(content);
  const id = presetId || CUSTOM_PRESETS[layout].id;
  const base = { heading: heading.trim().replace(/[:：]$/, ""), presetId: id, layout };

  switch (layout) {
    case "timeline":
      return { ...base, entries: parseTimeline(content) };
    case "skills":
      return { ...base, groups: parseSkills(content) };
    case "list":
      return { ...base, items: parseList(content) };
    case "text":
      return { ...base, body: content.map((line) => line.trim()).join("\n") };
  }
}

function hasToken(line: string): boolean {
  TOKEN.lastIndex = 0;
  return TOKEN.test(line);
}

export function heuristicStructure(redactedText: string): {
  profile: { name: string; title: string; location: string };
  sections: RawSection[];
} {
  const lines = redactedText.split("\n");
  const profile = { name: "", title: "", location: "" };
  const sections: RawSection[] = [];

  let heading: string | null = null;
  let presetId = "";
  let body: string[] = [];
  const header: string[] = [];

  const close = () => {
    if (heading === null) return;
    const section = buildSection(heading, presetId, body);
    if (section) sections.push(section);
  };

  for (const line of lines) {
    const detected = detectHeading(line);

    if (detected !== null) {
      close();
      heading = line;
      presetId = detected;
      body = [];
    } else if (heading === null) {
      header.push(line);
    } else {
      body.push(line);
    }
  }
  close();

  // Name is the first plain header line; a short line after it is the title.
  // Whatever else sits in the header is left for the coverage check.
  const plain = header.map((line) => line.trim()).filter((line) => line && !hasToken(line));
  if (plain[0] && plain[0].split(/\s+/).length <= 6) profile.name = plain[0];
  if (plain[1] && plain[1].split(/\s+/).length <= 8 && !/\d/.test(plain[1])) {
    profile.title = plain[1];
  }

  // Location usually shares the contact line: "Hanoi, Vietnam | [EMAIL1] | …".
  profile.location =
    header
      .filter(hasToken)
      .flatMap((line) => line.split(/\s*[|·•]\s*/))
      .map((part) => part.trim())
      .find((part) => part && !hasToken(part) && !/\d/.test(part) && part.length <= 40) ?? "";

  return { profile, sections };
}
