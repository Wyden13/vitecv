// Shared plumbing for every template.
//
// `data.theme` (libs/typst/theme.ts) is the user's Style panel choice, already
// resolved to concrete values:
//   accent, accent_soft   "#rrggbb"
//   heading_font          family list, e.g. ("Source Serif 4",)
//   body_font             family list
//   heading_size          points (13 | 14 | 15)
//   body_size             points (10 | 11 | 12)
//
// Templates were ported from the React/Tailwind versions, so lengths below are
// the CSS values converted at 96 px = 72 pt (Tailwind `mt-2` = 8 px = 6 pt).

// Tailwind's zinc scale (light), which the HTML templates drew with.
#let zinc-900 = rgb("#18181b")
#let zinc-800 = rgb("#27272a")
#let zinc-700 = rgb("#3f3f46")
#let zinc-600 = rgb("#52525b")
#let zinc-500 = rgb("#71717a")
#let zinc-200 = rgb("#e4e4e7")

// Used when a glyph is missing from the chosen family (all vendored, OFL/GUST).
#let fallback-fonts = ("Geist", "Source Serif 4")

#let resolve(data) = {
  let t = data.theme
  (
    accent: rgb(t.accent),
    soft: rgb(t.accent_soft),
    heading-font: t.heading_font + fallback-fonts,
    body-font: t.body_font + fallback-fonts,
    hs: t.heading_size * 1pt,
    bs: t.body_size * 1pt,
  )
}

// CSS line-height -> Typst leading. Typst measures a line from cap height to
// baseline (~0.7em), so the gap that reproduces a CSS line box is L - 0.7.
#let normal = 0.8em  // 1.5, Tailwind's inherited default
#let snug = 0.675em  // leading-snug, 1.375
#let tight = 0.55em  // leading-tight, 1.25
#let relaxed = 0.925em  // leading-relaxed, 1.625

// One-time page + text setup shared by the résumé templates.
#let setup(th, margin: (x: 0.7in, y: 0.6in), background: none, body) = {
  set page(paper: "us-letter", margin: margin, background: background)
  set text(font: th.body-font, size: th.bs, fill: zinc-900, lang: "en", hyphenate: false)
  set par(leading: normal, spacing: 0pt, justify: false)
  // All vertical rhythm comes from `row` below, never from implicit spacing.
  set block(spacing: 0pt)
  body
}

// One CSS block box: `m` is its margin-top and `lead` the line-height of its
// text. A CSS gap between two line boxes is the margin plus the half-leading
// of both lines, which in Typst terms is `m + lead` from baseline to cap top.
// The spacing is strong: weak spacing would vanish at the top of an entry's
// block. `first` marks the top of the page, where there is nothing to clear.
#let row(m: 0pt, lead: normal, justify: false, first: false, body) = {
  if not first { v(m + lead) }
  set par(leading: lead, justify: justify)
  block(width: 100%, body)
}

#let opt(s) = s != none and s != ""

// `whitespace-pre-line`: every newline the author typed is a line break.
#let lines(s) = s.split("\n").map(l => l.trim()).join(linebreak())

#let maybe-link(href, body) = if opt(href) { link(href, body) } else { body }

#let underlined(body) = underline(offset: 1.5pt, stroke: 0.5pt, body)

// Tailwind `list-disc pl-5`: the disc hangs in the 15 pt indent.
#let disc-list(items, justify: false) = {
  set par(justify: justify)
  list(indent: 4pt, body-indent: 6pt, marker: [•], ..items.map(i => [#i]))
}
