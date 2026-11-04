// Formal cover letter: traditional block letter with a sender header, date and
// recipient address. Port of the former
// components/coverletter/templates/Formal.tsx.

#import "/lib/theme.typ": *

#let render(data) = {
  let th = resolve(data)
  show: setup.with(th)
  set text(size: th.bs + 1pt)
  let s = data.sender

  block(width: 100%, inset: (bottom: 9pt), stroke: (bottom: 1.5pt + th.accent), {
    row(first: true, lead: tight, text(font: th.heading-font, size: th.hs + 3pt, weight: "bold", s.name))
    if opt(s.title) { row(text(size: th.bs + 0.5pt, fill: zinc-700, s.title)) }
    if s.contact.len() > 0 {
      row(m: 3pt, text(size: th.bs - 0.5pt, fill: zinc-700, s.contact.join(" · ")))
    }
  })

  if opt(data.date) { row(m: 18pt, lead: relaxed, text(size: th.bs + 0.5pt, fill: zinc-700, data.date)) }
  if data.recipient.len() > 0 {
    row(m: 15pt, lead: snug, text(size: th.bs + 0.5pt, fill: zinc-800, data.recipient.join(linebreak())))
  }
  if opt(data.subject) {
    row(m: 15pt, lead: relaxed, text(font: th.heading-font, weight: "semibold", data.subject))
  }
  if opt(data.salutation) { row(m: 15pt, lead: relaxed, data.salutation) }
  for (i, p) in data.body.enumerate() {
    row(m: if i == 0 { 12pt } else { 10.5pt }, lead: relaxed, p)
  }
  if opt(data.closing) { row(m: 18pt, lead: relaxed, data.closing) }
  if opt(data.signature) {
    row(m: 18pt, lead: relaxed, text(font: th.heading-font, weight: "semibold", data.signature))
  }
}
