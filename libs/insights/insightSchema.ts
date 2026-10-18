export type KeywordCategory =
  | "technical"
  | "tools"
  | "methods"
  | "domain"
  | "soft"
  | "credentials"
  | "titles";

export const KEYWORD_CATEGORIES: KeywordCategory[] = [
  "technical",
  "tools",
  "methods",
  "domain",
  "soft",
  "credentials",
  "titles",
];

export const CATEGORY_LABELS: Record<
  KeywordCategory,
  { title: string; hint: string }
> = {
  technical: {
    title: "Technical Skills",
    hint: "Languages, frameworks and libraries.",
  },
  tools: {
    title: "Tools & Platforms",
    hint: "Software, services and infrastructure.",
  },
  methods: {
    title: "Methods & Practices",
    hint: "How you work — Agile, CI/CD, code review.",
  },
  domain: {
    title: "Domain Knowledge",
    hint: "Industries and problem spaces.",
  },
  soft: {
    title: "Soft Skills",
    hint: "Collaboration, leadership, communication.",
  },
  credentials: {
    title: "Credentials",
    hint: "Degrees, certifications and licences.",
  },
  titles: {
    title: "Titles & Seniority",
    hint: "Roles you have held, and at what level.",
  },
};

/** Bounds both the render and the stored document. */
const MAX_SECTION_ENTRIES = 12;

/**
 * How `importance` reads back to the user. `JOB_MATCH_SYSTEM` asks for exactly
 * 90 | 70 | 50 | 30, but `normalizeGapPayload` clamps to 0-100 and would pass an
 * 85 straight through — so these are thresholds, not equality checks.
 */
export interface ImportanceTier {
  min: number;
  title: string;
  advice: string;
}

export const IMPORTANCE_TIERS: ImportanceTier[] = [
  {
    min: 90,
    title: "Must-haves you're missing",
    advice: "Add these first — the posting treats them as requirements.",
  },
  {
    min: 70,
    title: "Strongly expected",
    advice: "Named in the posting but not gating. Evidence them if you have them.",
  },
  {
    min: 50,
    title: "Expected",
    advice: "Mentioned in passing. Add where it is honest to.",
  },
  {
    min: 0,
    title: "Nice to have",
    advice: "Listed as a bonus — only worth adding if you genuinely have it.",
  },
];

export interface Keyword {
  term: string;
  category: KeywordCategory;
  weight: number;
  count: number;
  blockIds: string[];
}

export interface WeakPhrase {
  phrase: string;
  blockId: string;
  suggestion: string;
}

export interface WritingSignals {
  bulletCount: number;
  quantifiedCount: number;
  weakPhrases: WeakPhrase[];
}

export interface AnalysisPayload {
  keywords: Keyword[];
  signals: WritingSignals;
}

export interface ResumeAnalysis extends AnalysisPayload {
  model: string;
  sourceHash: string;
  createdAt: Date | null;
}

export interface RoleGapItem {
  term: string;
  category: KeywordCategory;
  importance: number;
  present: boolean;
}

export interface GapPayload {
  items: RoleGapItem[];
}

export interface RoleGap extends GapPayload {
  role: string;
  model: string;
  sourceHash: string;
  createdAt: Date | null;
}

export interface JobFacts {
  title: string | null;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  postedAt: string | null;
  salary: string | null;
}

/**
 * The posting's prose, as sections. Separate from `JobFacts` because these are
 * lists the model has to condense, not single values it can copy.
 */
export interface JobSections {
  responsibilities: string[];
  qualifications: string[];
  niceToHave: string[];
  benefits: string[];
}

export interface JobMatchPayload extends GapPayload {
  job: JobFacts;
  sections: JobSections;
}

export function createEmptyAnalysisPayload(): AnalysisPayload {
  return {
    keywords: [],
    signals: { bulletCount: 0, quantifiedCount: 0, weakPhrases: [] },
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}


function asCategory(value: unknown): KeywordCategory | null {
  const candidate = text(value).toLowerCase();
  return KEYWORD_CATEGORIES.find((category) => category === candidate) ?? null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeKeyword(
  value: unknown,
  knownBlockIds: Set<string>,
): Keyword | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const term = text(raw.term);
  const category = asCategory(raw.category);
  const weight = num(raw.weight);

  if (!term || !category || weight === null) return null;

  const blockIds = asArray(raw.blockIds)
    .map((id) => text(id))
    .filter((id) => knownBlockIds.has(id));

  return {
    term,
    category,
    weight: clamp(weight, 0, 100),
    count: clamp(num(raw.count) ?? 1, 1, 999),
    blockIds: [...new Set(blockIds)],
  };
}

function normalizeSignals(
  value: unknown,
  knownBlockIds: Set<string>,
  bulletCount?: number,
): WritingSignals {
  const raw = (value ?? {}) as Record<string, unknown>;
  const bullets = clamp(bulletCount ?? num(raw.bulletCount) ?? 0, 0, 9999);

  return {
    bulletCount: bullets,
    quantifiedCount: Math.min(
      bullets,
      clamp(num(raw.quantifiedCount) ?? 0, 0, 9999),
    ),
    weakPhrases: asArray(raw.weakPhrases)
      .map((entry) => {
        const candidate = (entry ?? {}) as Record<string, unknown>;

        return {
          phrase: text(candidate.phrase),
          blockId: text(candidate.blockId),
          suggestion: text(candidate.suggestion),
        };
      })
      .filter(
        (entry): entry is WeakPhrase =>
          Boolean(entry.phrase) && knownBlockIds.has(entry.blockId),
      ),
  };
}

export function normalizeAnalysisPayload(
  value: unknown,
  knownBlockIds: Iterable<string>,
  bulletCount?: number,
): AnalysisPayload {
  const known = new Set(knownBlockIds);
  const raw = (value ?? {}) as Record<string, unknown>;
  const byTerm = new Map<string, Keyword>();

  for (const entry of asArray(raw.keywords)) {
    const keyword = normalizeKeyword(entry, known);
    if (!keyword) continue;
    const key = keyword.term.toLowerCase();
    const existing = byTerm.get(key);

    if (!existing) {
      byTerm.set(key, keyword);
      continue;
    }

    byTerm.set(key, {
      ...(keyword.weight > existing.weight ? keyword : existing),
      count: Math.max(keyword.count, existing.count),
      blockIds: [...new Set([...existing.blockIds, ...keyword.blockIds])],
    });
  }

  return {
    keywords: [...byTerm.values()].sort((a, b) => b.weight - a.weight),
    signals: normalizeSignals(raw.signals, known, bulletCount),
  };
}

export function normalizeGapPayload(value: unknown): GapPayload {
  const raw = (value ?? {}) as Record<string, unknown>;
  const byTerm = new Map<string, RoleGapItem>();

  for (const entry of asArray(raw.items)) {
    if (!entry || typeof entry !== "object") continue;

    const item = entry as Record<string, unknown>;
    const term = text(item.term);
    const category = asCategory(item.category);
    if (!term || !category) continue;

    const key = term.toLowerCase();
    if (byTerm.has(key)) continue;

    byTerm.set(key, {
      term,
      category,
      importance: clamp(num(item.importance) ?? 50, 0, 100),
      // Anything but an explicit true is treated as missing: the honest
      // default is "we could not find it in your resume".
      present: item.present === true,
    });
  }

  return {
    items: [...byTerm.values()].sort((a, b) => b.importance - a.importance),
  };
}

/** Empty string, wrong type, or a model writing "Unknown" all mean "not stated". */
function fact(value: unknown): string | null {
  const candidate = text(value);
  if (!candidate) return null;

  return /^(unknown|n\/a|not specified|none|null)$/i.test(candidate)
    ? null
    : candidate;
}

export function normalizeJobFacts(value: unknown): JobFacts {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    title: fact(raw.title),
    company: fact(raw.company),
    location: fact(raw.location),
    employmentType: fact(raw.employmentType),
    postedAt: fact(raw.postedAt),
    salary: fact(raw.salary),
  };
}

/** One section list: trimmed, de-duplicated case-insensitively, and capped. */
function sectionList(value: unknown): string[] {
  const seen = new Set<string>();
  const entries: string[] = [];

  for (const entry of asArray(value)) {
    const line = text(entry);
    if (!line) continue;

    const key = line.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    entries.push(line);
    if (entries.length === MAX_SECTION_ENTRIES) break;
  }

  return entries;
}

/**
 * A match stored before sections existed has no `sections` field at all, and
 * reads back here as four empty lists — which is exactly the signal `JobDetail`
 * uses to fall back to the raw posting. No migration needed.
 */
export function normalizeJobSections(value: unknown): JobSections {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    responsibilities: sectionList(raw.responsibilities),
    qualifications: sectionList(raw.qualifications),
    niceToHave: sectionList(raw.niceToHave),
    benefits: sectionList(raw.benefits),
  };
}

export function hasJobSections(sections: JobSections): boolean {
  return (
    sections.responsibilities.length > 0 ||
    sections.qualifications.length > 0 ||
    sections.niceToHave.length > 0 ||
    sections.benefits.length > 0
  );
}

export function normalizeJobMatchPayload(value: unknown): JobMatchPayload {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    ...normalizeGapPayload(raw),
    job: normalizeJobFacts(raw.job),
    sections: normalizeJobSections(raw.sections),
  };
}

export interface MatchScore {
  /** 0–100, importance-weighted. */
  score: number;
  matched: number;
  total: number;
}

/**
 * Weighted by importance rather than a raw count, so a missing must-have costs
 * more than a missing nice-to-have. The counts come back alongside it because
 * the caption quotes them ("16 of 20 requirements").
 */
export function matchScore(items: RoleGapItem[]): MatchScore {
  const present = items.filter((item) => item.present);

  const weight = items.reduce((sum, item) => sum + item.importance, 0);
  const met = present.reduce((sum, item) => sum + item.importance, 0);

  return {
    // A model that returns every importance as 0 would divide by zero here.
    score: weight > 0 ? Math.round((met / weight) * 100) : 0,
    matched: present.length,
    total: items.length,
  };
}

/**
 * Buckets items into `IMPORTANCE_TIERS`, strongest first, dropping empty tiers.
 * Items arrive sorted by importance descending, so each bucket keeps that order.
 */
export function groupByTier(
  items: RoleGapItem[],
): { tier: ImportanceTier; items: RoleGapItem[] }[] {
  return IMPORTANCE_TIERS.map((tier, index) => {
    const upper = IMPORTANCE_TIERS[index - 1]?.min ?? Infinity;

    return {
      tier,
      items: items.filter(
        (item) => item.importance >= tier.min && item.importance < upper,
      ),
    };
  }).filter((group) => group.items.length > 0);
}

/**
 * FNV-1a over the analysed text. Same bar as `createId` in the resume schema:
 * stable enough to spot an edit, not a security boundary.
 */
export function hashText(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
