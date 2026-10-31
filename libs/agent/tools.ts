import { AGENT_TOOLS, type AgentToolName } from "./actions";

/**
 * The function schemas handed to GLM, and the mapping back to registry ids.
 *
 * Two naming schemes meet here on purpose. The API's function names are
 * snake_case (its charset excludes "."), while the registry keeps the dotted
 * ids the rest of the app reads well. `toAgentTool` is the only place that
 * knows both, and it checks the result against `AGENT_TOOLS` so a name the
 * model invents cannot smuggle itself through the translation step.
 *
 * Descriptions are the model's only documentation — they carry the rules about
 * ids and invention, because there is nowhere else for the model to read them.
 */

export interface GlmTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

const NAME_TO_TOOL: Record<string, AgentToolName> = {
  resume_replace_phrase: "resume.replacePhrase",
  resume_add_skill: "resume.addSkill",
  resume_add_bullet: "resume.addBullet",
  job_tracker_add: "jobTracker.add",
  cover_letter_create: "coverLetter.create",
};

export function toAgentTool(name: unknown): AgentToolName | null {
  if (typeof name !== "string") return null;

  const mapped = NAME_TO_TOOL[name];
  return AGENT_TOOLS.some((tool) => tool === mapped) ? mapped : null;
}

const str = (description: string) => ({ type: "string", description });

/**
 * Navigation, not a write — so it is deliberately absent from `NAME_TO_TOOL`
 * and never becomes a confirm card. It replaces the `suggest` field the JSON
 * contract used to carry, and its href is still checked against
 * `SUGGESTABLE_ROUTES` by `asSuggestion` before it is rendered as a link.
 */
export const SUGGEST_ROUTE_TOOL = "suggest_route";

export const AGENT_TOOL_SCHEMAS: GlmTool[] = [
  {
    type: "function",
    function: {
      name: "resume_add_skill",
      description:
        "Add a skill to a resume's skills section. Use when the user asks to add a technology, tool or competency. Creates the named group, and the skills section itself, if they do not exist.",
      parameters: {
        type: "object",
        properties: {
          resumeId: str("Id of the resume to edit, copied from the list of the user's resumes. Never invent one."),
          group: str('The skills group to put it under, e.g. "Languages" or "Frameworks".'),
          skill: str('A single skill, e.g. "Kubernetes". One call per skill.'),
        },
        required: ["resumeId", "group", "skill"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resume_add_bullet",
      description:
        "Append an achievement bullet to one experience, project or education entry. Write the bullet as it should read on the resume: past tense, concrete, quantified where the user has given you a number. Never invent numbers or facts the user has not stated.",
      parameters: {
        type: "object",
        properties: {
          resumeId: str("Id of the resume to edit, copied from the user's resume list."),
          blockId: str('Id of the entry to append to, in the form "s3-e1". Only entry ids work here; a bullet id like "s3-e1-b2" is not valid.'),
          bullet: str("The bullet text, one sentence, no leading dash."),
        },
        required: ["resumeId", "blockId", "bullet"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resume_replace_phrase",
      description:
        "Replace weak wording in a resume with a stronger rewrite of the same meaning. The phrase must be copied character-for-character from the resume text you were shown, or the edit will be refused.",
      parameters: {
        type: "object",
        properties: {
          resumeId: str("Id of the resume to edit, copied from the user's resume list."),
          blockId: str('Id of the block the phrase sits in, e.g. "s3-e1-b2".'),
          phrase: str("The exact existing wording to replace, quoted verbatim."),
          suggestion: str("The replacement wording, same meaning, stronger phrasing."),
        },
        required: ["resumeId", "blockId", "phrase", "suggestion"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "job_tracker_add",
      description:
        "Save a job posting to the user's application tracker. Use when they paste a posting or ask to track a role. Only fill fields the posting actually states — omit anything you would have to guess, and never infer an applied date.",
      parameters: {
        type: "object",
        properties: {
          company: str("Employer name, as written in the posting."),
          jobTitle: str("Job title, as written in the posting."),
          location: str("Location if stated."),
          url: str("Link to the posting if the user gave one."),
          description: str("A short summary of what the role asks for."),
          nextAction: str('The user\'s next step, e.g. "Tailor resume and apply".'),
        },
        required: ["company", "jobTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cover_letter_create",
      description:
        "Draft a new cover letter. Use only when the user asks for a letter. Write real prose in body paragraphs — no placeholders like [Your Name] and no invented employment history.",
      parameters: {
        type: "object",
        properties: {
          title: str('Name for the letter in their list, e.g. "Stripe - Backend Engineer".'),
          company: str("Employer the letter is addressed to."),
          recipientName: str('Named recipient if known, otherwise leave out and the salutation stays "Dear Hiring Manager,".'),
          subject: str("Subject line."),
          salutation: str('Greeting line, e.g. "Dear Hiring Manager,".'),
          body: {
            type: "array",
            items: { type: "string" },
            description: "Body paragraphs in order, each a complete paragraph.",
          },
          closing: str('Sign-off, e.g. "Sincerely,".'),
          signature: str("The user's name, if you know it."),
        },
        required: ["title", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: SUGGEST_ROUTE_TOOL,
      description:
        "Point the user at a page in the app, when a dedicated tool does the next step better than you can in chat. At most one per reply, and only when it genuinely helps.",
      parameters: {
        type: "object",
        properties: {
          label: str('Short imperative button label, e.g. "Open Job Match".'),
          href: str("One of the routes you were given. Never a full URL, never a path you invented."),
        },
        required: ["label", "href"],
      },
    },
  },
];
