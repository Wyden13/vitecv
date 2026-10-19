import {
  createId,
  normalizeResumeDocument,
  type ResumeDocument,
  type ResumeSection,
} from "@/libs/resume/resumeSchema";
import {
  CUSTOM_PRESETS,
  getSectionPreset,
} from "@/libs/resume/sectionPresets";

import { restoreTokens, TOKEN, type RedactedText } from "./contacts";

/**
 * The gate between a structuring attempt (GLM or the local heuristic) and the
 * editor. Two guarantees, both checked against the uploaded text itself:
 *
 * 1. Verbatim — every value must occur in the source, give or take whitespace.
 *    A reworded bullet is dropped rather than shown as if the user wrote it.
 * 2. Complete — every source line has to be claimed by some value. Lines
 *    nobody claimed (including ones whose reworded value was just dropped) are
 *    appended, as written, to an "Other" section. Nothing silently disappears.
 */

export interface ParsedResume {
  document: ResumeDocument;
  dropped: number;
  leftovers: number;
}

const LEADING_GLYPH = /^\s*(?:[•▪◦●○■□➢►▸‣⁃∙·]\s*|[*–—-]\s+)/;

function normalize(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function isWordChar(char: string | undefined): boolean {
  return !!char && /[\p{L}\p{N}]/u.test(char);
}

class SourceIndex {
  private readonly hay: string;
  private readonly covered: Uint8Array;
  private readonly spans: { line: string; start: number; end: number }[] = [];
  dropped = 0;

  constructor(source: string) {
    const parts: string[] = [];
    let offset = 0;

    for (const line of source.split("\n")) {
      const normalized = normalize(line);
      if (!normalized) continue;

      if (parts.length) offset += 1; // the joining space
      this.spans.push({ line: line.trim(), start: offset, end: offset + normalized.length });
      parts.push(normalized);
      offset += normalized.length;
    }

    this.hay = parts.join(" ");
    this.covered = new Uint8Array(this.hay.length);
  }

  private occurrences(needle: string): number[] {
    const found: number[] = [];
    const boundedStart = isWordChar(needle[0]);
    const boundedEnd = isWordChar(needle[needle.length - 1]);

    for (let at = this.hay.indexOf(needle); at !== -1; at = this.hay.indexOf(needle, at + 1)) {
      if (boundedStart && isWordChar(this.hay[at - 1])) continue;
      if (boundedEnd && isWordChar(this.hay[at + needle.length])) continue;
      found.push(at);
    }

    return found;
  }

  private mark(needle: string): boolean {
    const found = this.occurrences(needle);
    for (const at of found) this.covered.fill(1, at, at + needle.length);
    return found.length > 0;
  }

  /**
   * Returns the value when it is verbatim, else "" (and counts the drop). A
   * bullet symbol the model kept is forgiven: the source has it, the value
   * just should not.
   */
  accept(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (this.mark(normalize(trimmed))) return trimmed;

    const unglyphed = trimmed.replace(LEADING_GLYPH, "").trim();
    if (unglyphed && unglyphed !== trimmed && this.mark(normalize(unglyphed))) {
      return unglyphed;
    }

    this.dropped += 1;
    return "";
  }

  /** Marks text that came from the source by construction (contacts). */
  claim(value: string) {
    if (value.trim()) this.mark(normalize(value));
  }

  /** Lines with real content (two or more letters/digits) nothing claimed. */
  leftoverLines(): string[] {
    return this.spans
      .filter(({ start, end }) => {
        let unclaimed = 0;
        for (let i = start; i < end; i++) {
          if (!this.covered[i] && isWordChar(this.hay[i])) unclaimed += 1;
        }
        return unclaimed >= 2;
      })
      .map(({ line }) => line);
  }
}

function presetIdFor(section: ResumeSection): string {
  const preset = getSectionPreset(section.presetId, section.layout);

  return preset.id === section.presetId && preset.layout === section.layout
    ? section.presetId
    : CUSTOM_PRESETS[section.layout].id;
}

/** Applies `accept` to every value; returns null when nothing survives. */
function verifySection(
  section: ResumeSection,
  index: SourceIndex,
  restore: (value: string) => string,
): ResumeSection | null {
  const keep = (value: string) => index.accept(restore(value));
  const presetId = presetIdFor(section);

  switch (section.layout) {
    case "timeline": {
      const entries = section.entries
        .map((entry) => ({
          ...entry,
          title: keep(entry.title),
          subtitle: keep(entry.subtitle),
          meta: keep(entry.meta),
          start: keep(entry.start),
          end: keep(entry.end),
          description: keep(entry.description),
          url: keep(entry.url),
          bullets: entry.bullets.map(keep).filter(Boolean),
        }))
        .filter(
          (entry) =>
            entry.title || entry.subtitle || entry.meta || entry.start || entry.end ||
            entry.description || entry.url || entry.bullets.length > 0,
        );

      return entries.length ? { ...section, presetId, entries } : null;
    }

    case "skills": {
      const groups = section.groups
        .map((group) => ({
          ...group,
          group: keep(group.group),
          items: group.items.map(keep).filter(Boolean),
        }))
        .filter((group) => group.items.length > 0 || group.group);

      return groups.length ? { ...section, presetId, groups } : null;
    }

    case "text": {
      const restored = restore(section.body);
      let body = index.accept(restored);

      // A body that fails as a whole may still be mostly verbatim — the model
      // merged paragraphs or reworded one. Salvage it line by line.
      if (!body && restored.includes("\n")) {
        index.dropped -= 1;
        body = restored
          .split("\n")
          .map((line) => index.accept(line))
          .filter(Boolean)
          .join("\n");
      }

      return body ? { ...section, presetId, body } : null;
    }

    case "list": {
      const items = section.items.map(keep).filter(Boolean);
      return items.length ? { ...section, presetId, items } : null;
    }
  }
}

/** Profile text fields never carry a contact token — those are filled locally. */
function profileField(value: unknown, index: SourceIndex): string {
  if (typeof value !== "string") return "";
  TOKEN.lastIndex = 0;
  if (TOKEN.test(value)) return "";
  return index.accept(value);
}

/**
 * @param data   untrusted JSON from GLM, or the heuristic's output
 * @param source the extracted text, before redaction
 */
export function normalizeParsedResume(
  data: unknown,
  source: string,
  redacted: RedactedText,
): ParsedResume {
  const raw = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const index = new SourceIndex(source);
  const restore = (value: string) => restoreTokens(value, redacted.tokens);

  // Reuses the stored-document normalizer for shape: unknown layouts are
  // dropped, missing arrays become empty, ids are assigned.
  const shaped = normalizeResumeDocument({
    sections: Array.isArray(raw.sections) ? raw.sections : [],
  });

  const rawProfile = (raw.profile ?? {}) as Record<string, unknown>;
  const { contacts } = redacted;

  const profile = {
    name: profileField(rawProfile.name, index),
    title: profileField(rawProfile.title, index),
    location: profileField(rawProfile.location, index),
    email: contacts.email,
    phone: contacts.phone,
    links: contacts.links,
  };

  for (const value of redacted.tokens.values()) index.claim(value);

  const sections: ResumeSection[] = [];

  for (const section of shaped.sections) {
    const verified = verifySection(section, index, restore);
    if (!verified) continue;

    // The heading is ours to keep even when the resume never named the
    // section; it only claims a source line when it is actually there.
    index.claim(verified.heading);
    sections.push(verified);
  }

  const leftovers = index.leftoverLines();

  if (leftovers.length) {
    sections.push({
      id: createId(),
      heading: "Other",
      presetId: CUSTOM_PRESETS.text.id,
      layout: "text",
      body: leftovers.join("\n"),
    });
  }

  return {
    document: { ...shaped, profile, sections },
    dropped: index.dropped,
    leftovers: leftovers.length,
  };
}
