// Modern résumé: tinted sidebar for contact details and skills, experience
// alongside. Port of the former components/resume/templates/Modern.tsx.
//
// The sidebar tint is the page background, so it runs down every page; skills
// sections move to the sidebar, everything else stays in the main column.

#import "/lib/theme.typ": *

#let sidebar-width = 2.5in

#let dot(th) = box(height: 0.6em, align(horizon, circle(radius: 1.15pt, fill: th.accent)))

#let dot-list(th, items) = {
  set par(leading: snug)
  list(indent: 0pt, body-indent: 6pt, spacing: snug + 3pt, marker: dot(th), ..items.map(i => [#i]))
}

#let main-heading(th, title) = {
  if not opt(title.trim()) { return }
  v(normal, weak: true)
  block(sticky: true, {
    text(font: th.heading-font, size: th.hs - 2pt, weight: "bold", fill: th.accent, tracking: 0.12em, upper(title))
    v(3pt + 0.4em)
    line(length: 100%, stroke: 0.75pt + zinc-200)
  })
}

#let timeline(th, entries) = for e in entries {
  block(breakable: e.bullets.len() > 3, {
    set text(size: th.bs - 0.5pt)
    row(m: 9pt, grid(
      columns: (1fr, auto),
      column-gutter: 12pt,
      text(font: th.heading-font, size: th.bs + 1pt, weight: "semibold", e.title),
      if opt(e.dates) { text(size: th.bs - 1pt, fill: zinc-500, number-width: "tabular", e.dates) },
    ))
    if opt(e.subtitle) or opt(e.meta) {
      row(text(fill: zinc-600, (e.subtitle, e.meta).filter(opt).join(" · ")))
    }
    if opt(e.description) {
      row(m: 3pt, lead: snug, text(fill: zinc-800, lines(e.description)))
    }
    if opt(e.url_href) {
      row(link(e.url_href, text(fill: th.accent, underlined(e.url_text))))
    }
    if e.bullets.len() > 0 {
      row(m: 4.5pt, lead: snug, text(fill: zinc-800, dot-list(th, e.bullets)))
    }
  })
}

#let main-section(th, s, first) = {
  if not first { v(15pt) }
  main-heading(th, s.heading)
  set text(size: th.bs - 0.5pt)
  if s.layout == "timeline" { timeline(th, s.entries) }
  else if s.layout == "list" {
    row(m: 6pt, lead: snug, text(fill: zinc-800, dot-list(th, s.items)))
  } else if s.layout == "text" {
    row(m: 6pt, lead: snug, text(fill: zinc-800, lines(s.body)))
  }
}

#let sidebar-heading(th, title) = {
  v(15pt)
  row(block(sticky: true, text(
    font: th.heading-font, size: th.hs - 4pt, weight: "bold", fill: th.accent, tracking: 0.14em, upper(title),
  )))
}

#let sidebar(th, p, skill-sections) = {
  row(first: true, lead: tight, text(font: th.heading-font, size: th.hs + 4pt, weight: "bold", p.name))
  if opt(p.title) {
    row(m: 1.5pt, lead: snug, text(fill: th.accent, p.title))
  }

  set text(size: th.bs - 1pt)
  if p.contact.len() > 0 {
    sidebar-heading(th, "Contact")
    row(m: 3pt, lead: snug, text(fill: zinc-700, p.contact.join(linebreak())))
  }
  if p.links.len() > 0 {
    sidebar-heading(th, "Links")
    row(m: 3pt, lead: snug, text(fill: zinc-700, p.links.map(l => maybe-link(l.href, underlined(l.text))).join(linebreak())))
  }
  for s in skill-sections {
    if opt(s.heading.trim()) { sidebar-heading(th, s.heading) }
    for (i, g) in s.groups.enumerate() {
      row(m: if i == 0 { 3pt } else { 6pt }, lead: snug, {
        if opt(g.group) { text(weight: "semibold", g.group); linebreak() }
        text(fill: zinc-700, g.items)
      })
    }
  }
}

#let render(data) = {
  let th = resolve(data)
  show: setup.with(
    th,
    margin: (x: 0in, y: 0.5in),
    background: place(left + top, rect(width: sidebar-width, height: 100%, fill: th.soft)),
  )

  let skill-sections = data.sections.filter(s => s.layout == "skills")
  let main-sections = data.sections.filter(s => s.layout != "skills")

  grid(
    columns: (sidebar-width, 1fr),
    pad(x: 0.4in, sidebar(th, data.profile, skill-sections)),
    pad(x: 0.5in, {
      for (i, s) in main-sections.enumerate() { main-section(th, s, i == 0) }
    }),
  )
}
