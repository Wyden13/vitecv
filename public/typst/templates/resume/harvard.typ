// Harvard résumé: centred headings and serif type, the Harvard career-services
// format. Port of the former components/resume/templates/Harvard.tsx.
//
// Timeline presets put the organisation in `title`, the place in `meta` and
// the role in `subtitle`: organisation and place on one baseline, role and
// dates on the next. An entry with no role collapses to a single row.

#import "/lib/theme.typ": *

#let separator = " • "

#let section-heading(th, title) = {
  // A blank heading is a valid choice — print the content without one.
  if not opt(title.trim()) { return }
  v(normal, weak: true)
  block(sticky: true, width: 100%, align(center, text(
    font: th.heading-font, size: th.hs, weight: "bold", title,
  )))
}

// Left text with a right-hand aside that wraps once it passes 55% of the line,
// so a long tech stack in the aside slot never runs off the page.
#let split-row(main, aside) = layout(size => {
  if aside == none { return block(width: 100%, main) }
  let w = calc.min(measure(aside).width, size.width * 0.55)
  grid(columns: (1fr, w), column-gutter: 12pt, main, align(right, aside))
})

#let timeline(th, entries) = for e in entries {
  let aside = if opt(e.subtitle) { e.meta } else { (e.meta, e.dates).filter(opt).join(separator) }
  block(breakable: e.bullets.len() > 3, {
    row(m: 7.5pt, split-row(
      text(font: th.heading-font, size: th.bs + 1pt, weight: "bold", e.title),
      if opt(aside) { aside },
    ))
    if opt(e.subtitle) {
      row(split-row(text(weight: "bold", e.subtitle), if opt(e.dates) { box(e.dates) }))
    }
    if opt(e.description) {
      row(m: 1.5pt, lead: snug, justify: true, lines(e.description))
    }
    if opt(e.url_href) {
      row(link(e.url_href, text(fill: th.accent, underlined(e.url_text))))
    }
    if e.bullets.len() > 0 {
      row(m: 1.5pt, lead: snug, disc-list(e.bullets, justify: true))
    }
  })
}

#let section-body(th, s) = {
  if s.layout == "timeline" { timeline(th, s.entries) }
  else if s.layout == "skills" {
    for g in s.groups {
      row(m: 1.5pt, {
        if opt(g.group) { text(weight: "bold", g.group + ": ") }
        g.items
      })
    }
  } else if s.layout == "text" {
    row(m: 3pt, lead: snug, justify: true, lines(s.body))
  } else if s.layout == "list" {
    row(m: 3pt, lead: snug, disc-list(s.items, justify: true))
  }
}

#let render(data) = {
  let th = resolve(data)
  show: setup.with(th)
  let p = data.profile

  row(first: true, lead: tight, align(center, text(font: th.heading-font, size: th.hs, weight: "bold", p.name)))
  if opt(p.title) { row(align(center, p.title)) }
  v(3pt + 0.4em)
  line(length: 100%, stroke: 0.75pt + th.accent)
  let contact = p.contact.map(c => [#c]) + p.links.map(l => maybe-link(l.href, l.text))
  if contact.len() > 0 {
    row(m: 6pt, align(center, contact.map(box).join(separator)))
  }

  for s in data.sections {
    v(15pt)
    section-heading(th, s.heading)
    section-body(th, s)
  }
}
