import type { ChatMessage } from "@/libs/insights/prompts";

const MARKET_SYSTEM = `You describe what a job market typically asks for, to help someone target their resume.

Return ONLY a JSON object. No markdown, no prose, no code fences.

{
  "titles": ["string, a job title commonly advertised in this place"],
  "skills": ["string, a skill or requirement frequently asked for there"],
  "note": "string, one short sentence on what stands out about hiring in this market"
}

Rules:
- NEVER name a company, an employer, or a specific job opening. You do not have access to live listings and must not imply that you do.
- NEVER state a salary, a pay range, or a number of open roles. You cannot know these, and an invented figure is a serious error.
- Do not write "currently hiring", "there are openings", or anything that presents this as live data. This is general knowledge about a market, not a search result.
- At most 6 titles and 6 skills. Fewer is fine. Never pad.
- If the place is not one you know, return empty lists and say so plainly in note.
- Keep each entry to a few words — these render as chips.`;

export function marketGuidanceMessages(location: string): ChatMessage[] {
  return [
    { role: "system", content: MARKET_SYSTEM },
    { role: "user", content: `Job market: ${location.trim()}` },
  ];
}
