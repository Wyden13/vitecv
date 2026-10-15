/**
 * Shapes for a resume analysis, and the validation that makes them safe.
 *
 * Two untrusted sources feed these types: a model response and a Firestore
 * document. Both get the same treatment `normalizeResumeDocument` gives stored
 * resumes — coerce every field, drop what cannot be rendered, never trust a
 * shape just because the prompt asked for it.
 *
 * The categories are a closed set on purpose. An open one would let the model
 * invent a twentieth heading, and the page lays categories out as groups.
 */

export type KeywordCategory =
  | "technical"
  | "tools"
  | "methods"
  | "domain"
  | "soft"
  | "credentials"
  | "titles";

/** Display order on the page, and the order sent to the model. */
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

export interface Keyword {
  term: string;
  category: KeywordCategory;
  /** 0–100: prominence x repetition x specificity, as judged by the model. */
  weight: number;
  count: number;
  /** Ids of blocks the term was found in; always a subset of what we sent. */
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

/** What the model returns, before we stamp it with provenance. */
export interface AnalysisPayload {
  keywords: Keyword[];
  signals: WritingSignals;
}

export interface ResumeAnalysis extends AnalysisPayload {
  model: string;
  /** Hash of the analysed text, so a later edit can be detected. */
  sourceHash: string;
  createdAt: Date | null;
}

export interface RoleGapItem {
  term: string;
  category: KeywordCategory;
  /** 0–100: how strongly the role expects this. */
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

export function createEmptyAnalysisPayload(): AnalysisPayload {
  return {
    keywords: [],
    signals: { bulletCount: 0, quantifiedCount: 0, weakPhrases: [] },
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Accepts the numeric strings models sometimes emit despite the contract. */
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

/**
 * Validates one keyword, or returns null when it cannot be rendered.
 *
 * `blockIds` is filtered against the blocks we actually sent, which drops both
 * invented citations and — on a later read — citations into text the user has
 * since deleted.
 */
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

  // The caller counted the bullet blocks it sent, so prefer that over anything
  // in the payload. The prompt does not even ask for a bullet count — only for
  // how many of them are quantified — so on the model path there is nothing
  // here to fall back to.
  const bullets = clamp(bulletCount ?? num(raw.bulletCount) ?? 0, 0, 9999);

  return {
    bulletCount: bullets,
    // Cannot exceed the bullets it is counted out of.
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

/**
 * Turns a model response — or a stored document — into a payload safe to render.
 *
 * Duplicate terms collapse case-insensitively, keeping the heavier one and
 * merging their citations: a model asked for "every keyword" will sometimes
 * return "React" and "react" as separate entries.
 */
export function normalizeAnalysisPayload(
  value: unknown,
  knownBlockIds: Iterable<string>,
  /** Authoritative bullet total, when the caller counted the blocks it sent. */
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
