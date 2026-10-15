import type { CSSProperties } from "react";

/**
 * Design tokens shared by every resume and cover-letter template.
 *
 * Templates never hardcode a colour or a font family. They read these four
 * custom properties, which `themeStyle` writes onto the template root as
 * inline styles. The indirection is not optional: Tailwind compiles class
 * names ahead of time, so `text-[${accent}]` built from stored data would
 * never produce a rule. A *static* `text-[color:var(--tpl-accent)]` does, and
 * the variable behind it changes at runtime.
 */

export type AccentId = "emerald" | "navy" | "burgundy" | "slate";
export type FontPairId = "sans" | "serif" | "mixed";

export interface DocumentTheme {
  accent: AccentId;
  fontPair: FontPairId;
}

export interface AccentSpec {
  label: string;
  /** Headings, rules, links. Chosen to stay legible when printed in greyscale. */
  value: string;
  /** Sidebar and band fills; light enough to keep dark body text readable. */
  soft: string;
}

export const ACCENTS: Record<AccentId, AccentSpec> = {
  emerald: { label: "Emerald", value: "#047857", soft: "#ecfdf5" },
  navy: { label: "Navy", value: "#1e3a8a", soft: "#eef2ff" },
  burgundy: { label: "Burgundy", value: "#9f1239", soft: "#fff1f2" },
  slate: { label: "Slate", value: "#334155", soft: "#f1f5f9" },
};

export interface FontPairSpec {
  label: string;
  heading: string;
  body: string;
}

// Two loaded families cover three pairings. `--font-geist-sans` and
// `--font-source-serif` are declared by next/font in app/layout.tsx.
const SANS = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif";
const SERIF = "var(--font-source-serif), ui-serif, Georgia, serif";

export const FONT_PAIRS: Record<FontPairId, FontPairSpec> = {
  sans: { label: "Sans", heading: SANS, body: SANS },
  serif: { label: "Serif", heading: SERIF, body: SERIF },
  mixed: { label: "Mixed", heading: SERIF, body: SANS },
};

export const DEFAULT_THEME: DocumentTheme = {
  accent: "emerald",
  fontPair: "sans",
};

export const ACCENT_LIST = Object.entries(ACCENTS).map(([id, spec]) => ({
  id: id as AccentId,
  ...spec,
}));

export const FONT_PAIR_LIST = Object.entries(FONT_PAIRS).map(([id, spec]) => ({
  id: id as FontPairId,
  ...spec,
}));

/** Clamps stored values to known ids, so a hand-edited document still renders. */
export function normalizeTheme(
  value: Partial<DocumentTheme> | undefined | null,
): DocumentTheme {
  if (!value) return { ...DEFAULT_THEME };

  return {
    accent:
      value.accent && value.accent in ACCENTS
        ? value.accent
        : DEFAULT_THEME.accent,
    fontPair:
      value.fontPair && value.fontPair in FONT_PAIRS
        ? value.fontPair
        : DEFAULT_THEME.fontPair,
  };
}

/** Inline custom properties for a template root. */
export function themeStyle(theme: DocumentTheme): CSSProperties {
  const accent = ACCENTS[theme.accent] ?? ACCENTS[DEFAULT_THEME.accent];
  const fonts = FONT_PAIRS[theme.fontPair] ?? FONT_PAIRS[DEFAULT_THEME.fontPair];

  return {
    "--tpl-accent": accent.value,
    "--tpl-accent-soft": accent.soft,
    "--tpl-heading": fonts.heading,
    "--tpl-body": fonts.body,
  } as CSSProperties;
}
