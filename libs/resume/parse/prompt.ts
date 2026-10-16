import type { ChatMessage } from "@/libs/insights/prompts";
import { SECTION_PRESETS } from "@/libs/resume/sectionPresets";

/**
 * The structuring prompt and the JSON contract it promises.
 *
 * As with the Insights prompts, `json_object` is all GLM offers, so the shape
 * here is intent, not guarantee: `normalizeParsedResume` re-checks every value
 * against the uploaded text and drops anything the model reworded.
 */

function presetGuide(): string {
  return SECTION_PRESETS.map((preset) => {
    // Timeline presets no longer all carry the same fields, so list the ones
    // this preset actually offers rather than printing "meta=undefined".
    const fields =
      preset.layout === "timeline"
        ? ` (${[
            `title=${preset.labels.title}`,
            `subtitle=${preset.labels.subtitle}`,
            preset.labels.meta && `meta=${preset.labels.meta}`,
            preset.labels.description &&
              `description=${preset.labels.description}`,
            preset.labels.url && `url=${preset.labels.url}`,
          ]
            .filter(Boolean)
            .join(", ")})`
        : "";
    return `- ${preset.id} [${preset.layout}] "${preset.heading}"${fields}`;
  }).join("\n");
}

const SYSTEM = `You convert the plain text of an uploaded resume into structured JSON for a resume editor. You are a copier, not an editor.

Return ONLY a JSON object. No markdown, no prose, no code fences.

{
  "profile": { "name": "string", "title": "string", "location": "string" },
  "sections": [
    {
      "heading": "the section heading exactly as written in the resume",
      "presetId": "an id from the preset list, or custom-timeline / custom-skills / custom-text / custom-list",
      "layout": "timeline | skills | text | list",
      "entries": [{ "title": "", "subtitle": "", "meta": "", "start": "", "end": "", "description": "", "url": "", "bullets": [""] }],
      "groups": [{ "group": "", "items": [""] }],
      "body": "",
      "items": [""]
    }
  ]
}

Fill only the field that matches the layout: entries for timeline, groups for skills, body for text, items for list.

Presets (id [layout] "heading" and what the timeline fields mean):
${presetGuide()}

Rules:
- Copy every value CHARACTER FOR CHARACTER from the resume text. Never fix spelling, change capitalisation, translate, shorten, summarise or rephrase. Every value you output must appear verbatim in the input.
- Include ALL content. Every line of the resume belongs in some field. Do not skip anything.
- Keep the resume's own section headings and their order. Pick the closest presetId for each heading; use custom-<layout> when none fits.
- Timeline fields follow the preset's meaning above. Put dates in start and end exactly as written ("Jan 2021", "Present"); a single date goes in end. Leave a field "" when the resume does not state it. Never invent or infer a value.
- description: only where the preset above lists one. Copy the resume's own prose for that entry; "" otherwise.
- url: only for projects and certificates, and only when the resume states a link. Copy the placeholder ([LINK1]) or the address exactly as it appears; "" otherwise.
- A bullet is one bullet point. Drop only the bullet symbol itself ("•", "-", "▪"). A bullet that wraps onto the next line is still one bullet: join the lines with a single space.
- Skills: one group per line or category as the resume groups them; group is the label before the colon ("" if there is none); items are the comma or separator-split values.
- Profile: name, headline/job title, and location from the top of the resume. Leave a field "" if absent.
- Placeholders like [EMAIL1], [PHONE1], [LINK1] stand in for contact details. Never put them in profile. If one appears inside section content, copy it unchanged.`;

export function structureMessages(resumeText: string): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Resume text:\n\n${resumeText}` },
  ];
}
