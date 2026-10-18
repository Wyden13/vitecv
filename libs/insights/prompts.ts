import { KEYWORD_CATEGORIES } from "./insightSchema";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

const CATEGORY_LIST = KEYWORD_CATEGORIES.join(", ");

const CATEGORY_GUIDE = `Categories, use these ids exactly and nothing else:
- technical: programming languages, frameworks, libraries
- tools: software, services, platforms, infrastructure
- methods: ways of working — Agile, CI/CD, TDD, code review, design systems
- domain: industries and problem spaces — fintech, healthcare, logistics
- soft: collaboration, leadership, communication, mentoring
- credentials: degrees, certifications, licences
- titles: job titles and seniority markers`;

const ANALYSIS_SYSTEM = `You extract keywords from resumes for a job seeker who wants to see what their resume emphasises.

Return ONLY a JSON object. No markdown, no prose, no code fences.

{
  "keywords": [
    {
      "term": "string, the keyword as a recruiter would write it",
      "category": "one of: ${CATEGORY_LIST}",
      "weight": 0-100,
      "count": "integer, how many blocks mention it",
      "blockIds": ["ids of the blocks it appears in"]
    }
  ],
  "signals": {
    "quantifiedCount": "integer: how many bullet blocks contain a concrete number or measurable outcome",
    "weakPhrases": [
      {
        "phrase": "the weak wording, quoted from the block",
        "blockId": "the block it is in",
        "suggestion": "a stronger rewrite of that phrase, same meaning"
      }
    ]
  }
}

${CATEGORY_GUIDE}

Rules:
- weight reflects how strongly the resume emphasises the term: prominence (a title or summary outweighs a trailing skills list), repetition across blocks, and specificity ("Kubernetes" outweighs "cloud"). 100 is the single strongest term in this resume; spread the rest below it rather than clustering everything near 90.
- Prefer the canonical spelling: "TypeScript" not "typescript", "CI/CD" not "ci cd". Never return the same term twice.
- Extract only what the resume actually supports. Do not infer skills the text does not mention.
- blockIds MUST be ids copied from the input. Never invent one, and never cite a block that does not contain the term.
- Count a bullet as quantified when it carries a number, a percentage, a duration, or a scale ("12,000 analysts", "cut 38%", "three engineers").
- Weak phrasing means responsibility language with no outcome: "responsible for", "helped with", "worked on", "assisted in", "duties included". Only flag what is really there, and at most 8.
- Aim for 15-40 keywords. Fewer is fine for a short resume; never pad.`;

const GAP_SYSTEM = `You compare a resume against a target role for a job seeker deciding what to add.

Return ONLY a JSON object. No markdown, no prose, no code fences.

{
  "items": [
    {
      "term": "string, a keyword the role expects",
      "category": "one of: ${CATEGORY_LIST}",
      "importance": 90 | 70 | 50 | 30,
      "present": true | false
    }
  ]
}

${CATEGORY_GUIDE}

Rules:
- List what this role genuinely expects, strongest expectation first. Exactly 20 items.
- importance is how much the role expects the term, independent of the resume. Use one of exactly these four values, nothing in between:
    90 — must-have, the posting treats it as a requirement
    70 — strongly expected, named but not gating
    50 — expected, mentioned in passing
    30 — nice-to-have, listed as a bonus
- present is true ONLY when the resume blocks actually evidence it. If you are unsure, use false — a false negative costs the user a glance, a false positive costs them an interview.
- Judge presence on meaning, not spelling: "React" present as "ReactJS" is still present.
- Never return the same term twice.`;

/**
 * The gap contract plus the posting's own facts. Unlike `GAP_SYSTEM` this one
 * always receives a full description, so it can ask for metadata — and has to
 * spend most of its rules forbidding the model from inventing any of it.
 */
const JOB_MATCH_SYSTEM = `You read a job posting and compare it against a resume, for a job seeker deciding whether to apply.

Return ONLY a JSON object. No markdown, no prose, no code fences.

{
  "job": {
    "title": "string or null, the role as the posting names it",
    "company": "string or null, the hiring organisation",
    "location": "string or null, as written — city, region, or Remote",
    "employmentType": "string or null — Full-time, Contract, Internship, …",
    "postedAt": "string or null, as written — e.g. Posted 3 days ago",
    "salary": "string or null, the stated range with its currency and period"
  },
  "sections": {
    "responsibilities": ["string, one duty per entry, condensed to a single line"],
    "qualifications": ["string, a stated requirement"],
    "niceToHave": ["string, an explicitly optional or bonus requirement"],
    "benefits": ["string, compensation, perks, working arrangements"]
  },
  "items": [
    {
      "term": "string, a keyword the role expects",
      "category": "one of: ${CATEGORY_LIST}",
      "importance": 90 | 70 | 50 | 30,
      "present": true | false
    }
  ]
}

${CATEGORY_GUIDE}

Rules for "job":
- Copy these from the posting. Use null for anything it does not state.
- NEVER guess, infer, or supply a typical value. A null is correct and useful; an invented company, location or salary is a serious error.
- Do not write "Unknown", "N/A" or "Not specified" — use null.
- Do not convert or normalise a salary. Quote it as written.

Rules for "sections":
- Condense each entry to one line in the posting's own words. Do not editorialise.
- Return [] for a section the posting does not have. An empty list is correct and useful; an invented responsibility or benefit is a serious error.
- Never pad a short posting. At most 12 entries per list.
- Put a requirement the posting marks as optional, preferred or a bonus in niceToHave, not qualifications. Never repeat the same entry in two lists.
- These are the posting's prose, not the resume comparison — say nothing here about the candidate.

Rules for "items":
- List what this role genuinely expects, strongest expectation first. Exactly 20 items.
- importance is how much the role expects the term, independent of the resume. Use one of exactly these four values, nothing in between:
    90 — must-have, the posting treats it as a requirement
    70 — strongly expected, named but not gating
    50 — expected, mentioned in passing
    30 — nice-to-have, listed as a bonus
- present is true ONLY when the resume blocks actually evidence it. If you are unsure, use false — a false negative costs the user a glance, a false positive costs them an interview.
- Judge presence on meaning, not spelling: "React" present as "ReactJS" is still present.
- Never return the same term twice.`;

export function analysisMessages(serializedBlocks: string): ChatMessage[] {
  return [
    { role: "system", content: ANALYSIS_SYSTEM },
    {
      role: "user",
      content: `Resume blocks:\n\n${serializedBlocks}`,
    },
  ];
}

export function gapMessages(
  serializedBlocks: string,
  role: string,
): ChatMessage[] {
  const target =
    role.trim().length > 120
      ? `Target role, from this job description:\n\n${role.trim()}`
      : `Target role: ${role.trim()}`;

  return [
    { role: "system", content: GAP_SYSTEM },
    {
      role: "user",
      content: `${target}\n\nResume blocks:\n\n${serializedBlocks}`,
    },
  ];
}

export function jobMatchMessages(
  serializedBlocks: string,
  description: string,
): ChatMessage[] {
  return [
    { role: "system", content: JOB_MATCH_SYSTEM },
    {
      role: "user",
      content: `Job posting:\n\n${description.trim()}\n\nResume blocks:\n\n${serializedBlocks}`,
    },
  ];
}
