// public/typst/main.typ — entry point for every document the app typesets.
//
// The browser compiler (libs/typst/client.ts) passes three inputs:
//   kind      "resume" | "letter"
//   template  a template id from the matching dictionary below
//   doc       the document as JSON, shaped by libs/typst/resumeDoc.ts or
//             libs/typst/coverLetterDoc.ts (every field present, never null)
//
// The same file compiles with the Typst CLI, using only the vendored fonts:
//
//   typst compile --root public/typst --font-path public/typst/fonts \
//     --ignore-system-fonts --input kind=resume --input template=classic \
//     --input doc="$(cat resume.json)" public/typst/main.typ out.pdf
//
// To add a template: write templates/<kind>/<id>.typ exporting `render(data)`,
// import it here, add it to the dictionary, and register it in
// libs/typst/templates.ts.

#import "/templates/resume/classic.typ" as resume-classic
#import "/templates/resume/modern.typ" as resume-modern
#import "/templates/resume/harvard.typ" as resume-harvard
#import "/templates/letter/formal.typ" as letter-formal
#import "/templates/letter/modernLetter.typ" as letter-modern

#let templates = (
  resume: (
    classic: resume-classic.render,
    modern: resume-modern.render,
    harvard: resume-harvard.render,
  ),
  letter: (
    formal: letter-formal.render,
    modernLetter: letter-modern.render,
  ),
)

#let kind = sys.inputs.at("kind", default: "resume")
#let kind = if kind in templates { kind } else { "resume" }
#let family = templates.at(kind)
#let template-id = sys.inputs.at("template", default: "")
#let template-id = if template-id in family { template-id } else { family.keys().first() }

#let raw-doc = sys.inputs.at("doc", default: none)
#if raw-doc == none { panic("main.typ needs the document JSON in sys.inputs.doc") }

#(family.at(template-id))(json(bytes(raw-doc)))
