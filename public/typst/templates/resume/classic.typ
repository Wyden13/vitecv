// Classic résumé: single column, no graphics. Port of the former
// components/resume/templates/Classic.tsx.

#import "/lib/theme.typ": *

#let section-heading(th, title) = {
  if not opt(title.trim()) { return }
  v(normal, weak: true)
  block(
    width: 100%,
    inset: (bottom: 1.5pt),
    stroke: (bottom: 0.75pt + th.accent),
    sticky: true,
    text(font: th.heading-font, size: th.hs, weight: "bold", fill: th.accent, title),
  )
}

#let timeline(th, entries) = for e in entries {
  block(breakable: e.bullets.len() > 3, {
    row(m: 6pt, grid(
      columns: (1fr, auto),
      column-gutter: 12pt,
      text(font: th.heading-font, size: th.bs + 1pt, weight: "bold", e.title),
      if opt(e.dates) { text(fill: zinc-700, e.dates) },
    ))
    if opt(e.subtitle) or opt(e.meta) {
      row(text(fill: zinc-800, {
        if opt(e.subtitle) { text(weight: "semibold", e.subtitle) }
        if opt(e.subtitle) and opt(e.meta) { text(fill: zinc-500, " | ") }
        e.meta
      }))
    }
    if opt(e.description) {
      row(m: 1.5pt, lead: snug, text(fill: zinc-800, lines(e.description)))
    }
    if opt(e.url_href) {
      row(link(e.url_href, text(fill: th.accent, underlined(e.url_text))))
    }
    if e.bullets.len() > 0 {
      row(m: 3pt, lead: snug, text(fill: zinc-800, disc-list(e.bullets)))
    }
  })
}

#let section-body(th, s) = {
  if s.layout == "timeline" { timeline(th, s.entries) }
  else if s.layout == "skills" {
    for g in s.groups {
      row(m: 3pt, text(fill: zinc-800, {
        if opt(g.group) { text(weight: "bold", g.group + ": ") }
        g.items
      }))
    }
  } else if s.layout == "text" {
    row(m: 3pt, lead: snug, text(fill: zinc-800, lines(s.body)))
  } else if s.layout == "list" {
    row(m: 3pt, lead: snug, text(fill: zinc-800, disc-list(s.items)))
  }
}

#let render(data) = {
  let th = resolve(data)
  show: setup.with(th)
  let p = data.profile

  row(first: true, lead: tight, text(font: th.heading-font, size: th.hs + 9pt, weight: "bold", p.name))
  if opt(p.title) {
    row(text(size: th.bs + 2pt, fill: zinc-700, p.title))
  }
  if p.contact.len() > 0 {
    row(m: 3pt, text(style: "italic", fill: zinc-700, p.contact.join(linebreak())))
  }
  if p.links.len() > 0 {
    row(m: 1.5pt, p.links.map(l => maybe-link(l.href, text(fill: th.accent, underlined(l.text)))).join(linebreak()))
  }

  for s in data.sections {
    v(12pt)
    section-heading(th, s.heading)
    section-body(th, s)
  }
}
