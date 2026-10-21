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
