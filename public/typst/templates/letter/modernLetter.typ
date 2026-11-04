// Modern cover letter: tinted header band that matches the Modern résumé.
// Port of the former components/coverletter/templates/ModernLetter.tsx.
//
// The page keeps normal margins so a second page is inset too; the band on
// page one bleeds into them with negative padding.

#import "/lib/theme.typ": *

#let mx = 0.7in
#let my = 0.5in

#let render(data) = {
  let th = resolve(data)
  show: setup.with(th, margin: (x: mx, y: my))
  set text(size: th.bs + 0.5pt)
  let s = data.sender

  pad(x: -mx, top: -my, block(width: 100%, fill: th.soft, inset: (x: mx, y: my), {
    row(first: true, lead: tight, text(font: th.heading-font, size: th.hs + 7pt, weight: "bold", s.name))
    if opt(s.title) { row(m: 1.5pt, lead: relaxed, text(size: th.bs + 1pt, fill: th.accent, s.title)) }
    if s.contact.len() > 0 {
      row(m: 6pt, lead: relaxed, text(size: th.bs - 1pt, fill: zinc-700, s.contact.join(" · ")))
    }
  }))

  if data.recipient.len() > 0 or opt(data.date) {
    row(m: my, lead: snug, grid(
      columns: (1fr, auto),
      column-gutter: 24pt,
      text(size: th.bs - 0.5pt, fill: zinc-700, data.recipient.join(linebreak())),
      if opt(data.date) { text(size: th.bs - 0.5pt, fill: zinc-500, data.date) },
    ))
  }
  if opt(data.subject) {
    row(m: 18pt, lead: relaxed, text(font: th.heading-font, size: th.hs - 1pt, weight: "semibold", fill: th.accent, data.subject))
  }
  if opt(data.salutation) { row(m: 12pt, lead: relaxed, data.salutation) }
  for (i, p) in data.body.enumerate() {
    row(m: if i == 0 { 9pt } else { 10.5pt }, lead: relaxed, p)
  }
  if opt(data.closing) { row(m: 21pt, lead: relaxed, text(fill: zinc-700, data.closing)) }
  if opt(data.signature) {
    row(m: if opt(data.closing) { 15pt } else { 21pt }, lead: relaxed, text(font: th.heading-font, size: th.hs - 1pt, weight: "semibold", fill: th.accent, data.signature))
  }
}
