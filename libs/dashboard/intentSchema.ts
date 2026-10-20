export type DashboardIntent =
  | "resume"
  | "coverLetter"
  | "jobMatch"
  | "insights"
  | "tracker"
  | "unclear";

export const DASHBOARD_INTENTS: DashboardIntent[] = [
  "resume",
  "coverLetter",
  "jobMatch",
  "insights",
  "tracker",
  "unclear",
];

export interface PromptRoute {
  intent: DashboardIntent;
  /** The posting text, when the model judged the input to be one. */
  jobDescription: string;
  /** A target role it extracted, if any. */
  role: string;
  /** One short sentence — shown inline when the intent is "unclear". */
  note: string;
}

export interface MarketGuidance {
  location: string;
  titles: string[];
  skills: string[];
  note: string;
}

const MAX_GUIDANCE_ENTRIES = 6;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function shortList(value: unknown): string[] {
  const seen = new Set<string>();
  const entries: string[] = [];

  for (const entry of asArray(value)) {
    const line = text(entry);
    if (!line) continue;

    const key = line.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    entries.push(line);
    if (entries.length === MAX_GUIDANCE_ENTRIES) break;
  }

  return entries;
}

function asIntent(value: unknown): DashboardIntent {
  // "unclear" is the honest default: routing somewhere arbitrary is worse
  // than asking the user what they meant.
  return (
    DASHBOARD_INTENTS.find((candidate) => candidate === value) ?? "unclear"
  );
}

export function normalizePromptRoute(value: unknown): PromptRoute {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    intent: asIntent(raw.intent),
    jobDescription: text(raw.jobDescription),
    role: text(raw.role),
    note: text(raw.note),
  };
}

export function normalizeMarketGuidance(
  value: unknown,
  location: string,
): MarketGuidance {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    location,
    titles: shortList(raw.titles),
    skills: shortList(raw.skills),
    note: text(raw.note),
  };
}
