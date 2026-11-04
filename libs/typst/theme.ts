import {
  ACCENTS,
  DEFAULT_THEME,
  FONT_PAIRS,
  type DocumentTheme,
  type FontPairId,
} from "../templateTheme";

/**
 * The Style panel's choices resolved to what Typst needs: hex colours, real
 * font family names and point sizes. Read by `resolve()` in
 * public/typst/lib/theme.typ.
 */
export interface TypstTheme {
  accent: string;
  accent_soft: string;
  heading_font: string[];
  body_font: string[];
  heading_size: number;
  body_size: number;
}

/**
 * Typst cannot use the CSS stacks in `FONT_PAIRS`; it needs font files. Every
 * family named here is vendored in public/typst/fonts and listed in
 * `FONT_URLS` (libs/typst/client.ts). "Times New Roman" is proprietary, so
 * the Times pair typesets in TeX Gyre Termes, a metric-compatible Times clone.
 */
const SANS = "Geist";
const SERIF = "Source Serif 4";
const TIMES = "TeX Gyre Termes";
const GARAMOND = "EB Garamond";

export const TYPST_FONT_PAIRS = {
  sans: { heading: SANS, body: SANS },
  serif: { heading: SERIF, body: SERIF },
  mixed: { heading: SERIF, body: SANS },
  times: { heading: TIMES, body: TIMES },
  garamond: { heading: GARAMOND, body: GARAMOND },
} satisfies Record<FontPairId, { heading: string; body: string }>;

export function toTypstTheme(theme: DocumentTheme): TypstTheme {
  const accent = ACCENTS[theme.accent] ?? ACCENTS[DEFAULT_THEME.accent];
  const fonts =
    TYPST_FONT_PAIRS[theme.fontPair in FONT_PAIRS ? theme.fontPair : DEFAULT_THEME.fontPair];

  return {
    accent: accent.value,
    accent_soft: accent.soft,
    heading_font: [fonts.heading],
    body_font: [fonts.body],
    heading_size: theme.headingSize ?? DEFAULT_THEME.headingSize,
    body_size: theme.bodySize ?? DEFAULT_THEME.bodySize,
  };
}
