import type { CSSProperties } from "react";

/**
 * Design tokens shared by every resume and cover-letter template.
 *
 * Templates never hardcode a colour, a font family or a type size. They read
 * these custom properties, which `themeStyle` writes onto the template root as
 * inline styles. The indirection is not optional: Tailwind compiles class
 * names ahead of time, so `text-[${accent}]` built from stored data would
 * never produce a rule. A *static* `text-[color:var(--tpl-accent)]` does, and
 * the variable behind it changes at runtime.
 */

export type AccentId = "emerald" | "navy" | "burgundy" | "slate" | "black";
export type FontPairId = "sans" | "serif" | "mixed" | "times" | "garamond";

/**
 * Type sizes follow the Harvard career-services guidance: the name and section
 * headings sit at 13–15pt, body copy at 10–12pt. Templates express every other
 * size as a `calc()` offset from one of the two, so the whole page scales
 * together instead of drifting apart.
 */
export const HEADING_SIZES = [13, 14, 15] as const;
export const BODY_SIZES = [10, 11, 12] as const;

export type HeadingSize = (typeof HEADING_SIZES)[number];
export type BodySize = (typeof BODY_SIZES)[number];

export interface DocumentTheme {
  accent: AccentId;
  fontPair: FontPairId;
  headingSize: HeadingSize;
  bodySize: BodySize;
}

export interface AccentSpec {
  label: string;
  value: string;
  soft: string;
}

export const ACCENTS: Record<AccentId, AccentSpec> = {
  emerald: { label: "Emerald", value: "#047857", soft: "#ecfdf5" },
  navy: { label: "Navy", value: "#1e3a8a", soft: "#eef2ff" },
  burgundy: { label: "Burgundy", value: "#9f1239", soft: "#fff1f2" },
  slate: { label: "Slate", value: "#334155", soft: "#f1f5f9" },
  black: { label: "Black", value: "#000000", soft: "#f4f4f5" },
};

export interface FontPairSpec {
  label: string;
  heading: string;
  body: string;
}
const SANS = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif";
const SERIF = "var(--font-source-serif), ui-serif, Georgia, serif";
/** Resident on Windows and macOS; the stack degrades to the generic serif. */
const TIMES = '"Times New Roman", Times, ui-serif, serif';
const GARAMOND =
  'var(--font-eb-garamond), Garamond, "EB Garamond", Baskerville, ui-serif, serif';

export const FONT_PAIRS: Record<FontPairId, FontPairSpec> = {
  sans: { label: "Sans", heading: SANS, body: SANS },
  serif: { label: "Serif", heading: SERIF, body: SERIF },
  mixed: { label: "Mixed", heading: SERIF, body: SANS },
  times: { label: "Times New Roman", heading: TIMES, body: TIMES },
  garamond: { label: "Garamond", heading: GARAMOND, body: GARAMOND },
};

/**
 * 13/10 rather than the handout's 14/11: these are the sizes Classic and Modern
 * were drawn at before the size axis existed, so every saved document keeps the
 * layout its author approved. Templates that want the Harvard proportions ship
 * them as their own `defaultTheme`.
 */
export const DEFAULT_THEME: DocumentTheme = {
  accent: "emerald",
  fontPair: "sans",
  headingSize: 13,
  bodySize: 10,
};

export const ACCENT_LIST = Object.entries(ACCENTS).map(([id, spec]) => ({
  id: id as AccentId,
  ...spec,
}));

export const FONT_PAIR_LIST = Object.entries(FONT_PAIRS).map(([id, spec]) => ({
  id: id as FontPairId,
  ...spec,
}));

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
    // Documents saved before the size axis existed have neither field, so the
    // fallback here is the common path rather than an edge case.
    headingSize: HEADING_SIZES.includes(value.headingSize as HeadingSize)
      ? (value.headingSize as HeadingSize)
      : DEFAULT_THEME.headingSize,
    bodySize: BODY_SIZES.includes(value.bodySize as BodySize)
      ? (value.bodySize as BodySize)
      : DEFAULT_THEME.bodySize,
  };
}

export function themeStyle(theme: DocumentTheme): CSSProperties {
  const accent = ACCENTS[theme.accent] ?? ACCENTS[DEFAULT_THEME.accent];
  const fonts = FONT_PAIRS[theme.fontPair] ?? FONT_PAIRS[DEFAULT_THEME.fontPair];

  return {
    "--tpl-accent": accent.value,
    "--tpl-accent-soft": accent.soft,
    "--tpl-heading": fonts.heading,
    "--tpl-body": fonts.body,
    "--tpl-heading-size": `${theme.headingSize ?? DEFAULT_THEME.headingSize}pt`,
    "--tpl-body-size": `${theme.bodySize ?? DEFAULT_THEME.bodySize}pt`,
  } as CSSProperties;
}
