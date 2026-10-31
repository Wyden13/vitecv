import {
  createEmptyCoverLetterDocument,
  type CoverLetterDocument,
} from "@/libs/coverletter/coverLetterSchema";
import type { WeakPhrase } from "@/libs/insights/insightSchema";
import {
  createEmptyJobApplication,
  type JobApplicationInput,
} from "@/libs/jobtracker/jobTrackerSchema";
import type { ResumeDocument } from "@/libs/resume/resumeSchema";

import { readTarget, replacePhraseAt, resolveBlockTarget } from "./blockTarget";
import {
  addBullet,
  addSkill,
  resolveEntryTarget,
  type TransformResult,
} from "./transforms";

/**
 * The registry of actions an agent may dispatch, and the whitelist that makes
 * it safe to dispatch them.
 *
 * `libs/chat/chatSchema.ts` already treats model output as hostile:
 * `SUGGESTABLE_ROUTES` is checked by `asSuggestion()` because `suggest.href`
 * is model-written and rendered as a link. A tool name that drives a *write*
 * earns at least that much suspicion, so `normalizeAction` drops anything not
 * named here rather than trusting the caller to have checked.
 *
 * Approval is two gates, and passing the first does not skip the second: a
 * tool must be in this registry (design time) *and* confirmed by the user
 * (runtime). There is no undo layer — the editor holds only current state —
 * so the human gate is the last line.
 */

export const AGENT_TOOLS = [
  "resume.replacePhrase",
  "resume.addSkill",
  "resume.addBullet",
  "jobTracker.add",
  "coverLetter.create",
] as const;

export type AgentToolName = (typeof AGENT_TOOLS)[number];

export type ActionArgs = Record<string, string | string[]>;

export interface ProposedAction {
  tool: AgentToolName;
  args: ActionArgs;
}

/**
 * What a confirmed action does. Resume edits carry a transform rather than a
 * finished document, because the document is fetched at click time — a
 * proposal may sit on screen for minutes before anyone acts on it.
 */
export type ActionEffect =
  | {
      kind: "resume";
      resumeId: string;
      apply: (document: ResumeDocument) => TransformResult;
    }
  | { kind: "jobApplication"; input: JobApplicationInput }
  | { kind: "coverLetter"; title: string; document: CoverLetterDocument };

export interface ActionProposal {
  tool: AgentToolName;
  /** One line naming what happens and where, shown on the confirm card. */
  summary: string;
  effect: ActionEffect;
}

export type ActionBlocker = "invalid" | "unsupported" | "changed";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function lines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean);
}

export function isAgentTool(value: unknown): value is AgentToolName {
  return AGENT_TOOLS.some((tool) => tool === value);
}

/**
 * The trust boundary for model-written actions. Total: returns null rather
 * than throwing, matching the `normalize*` convention used across the app.
 * Values are narrowed to strings and string arrays, so nothing else reaches a
 * tool reader.
 */
export function normalizeAction(value: unknown): ProposedAction | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  if (!isAgentTool(raw.tool)) return null;

  const source = (raw.args ?? {}) as Record<string, unknown>;
  const args: ActionArgs = {};

  for (const [key, entry] of Object.entries(source)) {
    if (Array.isArray(entry)) {
      const list = lines(entry);
      if (list.length > 0) args[key] = list;
      continue;
    }

    const line = text(entry);
    if (line) args[key] = line;
  }

  return { tool: raw.tool, args };
}

function arg(action: ProposedAction, key: string): string {
  const value = action.args[key];
  return typeof value === "string" ? value : "";
}

function argList(action: ProposedAction, key: string): string[] {
  const value = action.args[key];
  return Array.isArray(value) ? value : [];
}

function quote(value: string, limit = 60): string {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

/**
 * Resolves a proposal into something applicable, without needing the document
 * — chat does not hold one, and fetching every referenced resume just to
 * render a transcript is the wrong trade. Arguments are checked here; the
 * document is checked inside the effect, at click time.
 */
export function buildAction(
  action: ProposedAction,
  resumeTitles: Record<string, string>,
): { ok: true; proposal: ActionProposal } | { ok: false; blocker: ActionBlocker } {
  const named = (id: string) => resumeTitles[id] ?? "your resume";

  switch (action.tool) {
    case "resume.addSkill": {
      const resumeId = arg(action, "resumeId");
      const group = arg(action, "group");
      const skill = arg(action, "skill");
      if (!resumeId || !group || !skill) return { ok: false, blocker: "invalid" };

      return {
        ok: true,
        proposal: {
          tool: action.tool,
          summary: `Add “${skill}” to ${group} in ${named(resumeId)}`,
          effect: {
            kind: "resume",
            resumeId,
            apply: (document) => addSkill(document, group, skill),
          },
        },
      };
    }

    case "resume.addBullet": {
      const resumeId = arg(action, "resumeId");
      const blockId = arg(action, "blockId");
      const bullet = arg(action, "bullet");
      if (!resumeId || !blockId || !bullet) return { ok: false, blocker: "invalid" };

      return {
        ok: true,
        proposal: {
          tool: action.tool,
          summary: `Add a bullet to ${named(resumeId)}: “${quote(bullet)}”`,
          effect: {
            kind: "resume",
            resumeId,
            apply: (document) => {
              const target = resolveEntryTarget(document, blockId);
              if (!target) return { ok: false, reason: "missing" };
              return addBullet(document, target, bullet);
            },
          },
        },
      };
    }

    case "resume.replacePhrase": {
      const resumeId = arg(action, "resumeId");
      const blockId = arg(action, "blockId");
      const phrase = arg(action, "phrase");
      const suggestion = arg(action, "suggestion");
      if (!resumeId || !blockId || !phrase || !suggestion) {
        return { ok: false, blocker: "invalid" };
      }

      return {
        ok: true,
        proposal: {
          tool: action.tool,
          summary: `In ${named(resumeId)}, rewrite “${quote(phrase)}” as “${quote(suggestion)}”`,
          effect: {
            kind: "resume",
            resumeId,
            apply: (document) => {
              const target = resolveBlockTarget(document, blockId);
              if (!target) return { ok: false, reason: "missing" };

              const next = replacePhraseAt(document, target, phrase, suggestion);
              return next
                ? { ok: true, document: next }
                : { ok: false, reason: "changed" };
            },
          },
        },
      };
    }

    case "jobTracker.add": {
      const company = arg(action, "company");
      const jobTitle = arg(action, "jobTitle");
      if (!company || !jobTitle) return { ok: false, blocker: "invalid" };

      return {
        ok: true,
        proposal: {
          tool: action.tool,
          summary: `Track ${jobTitle} at ${company}`,
          effect: {
            kind: "jobApplication",
            // Built from the empty shape so every field the tracker expects is
            // present, and so a field the model omitted stays at its default
            // rather than becoming undefined in Firestore.
            input: {
              ...createEmptyJobApplication(),
              company,
              jobTitle,
              location: arg(action, "location"),
              url: arg(action, "url"),
              description: arg(action, "description"),
              nextAction: arg(action, "nextAction"),
              source: "assistant",
            },
          },
        },
      };
    }

    case "coverLetter.create": {
      const title = arg(action, "title");
      const body = argList(action, "body");
      if (!title || body.length === 0) return { ok: false, blocker: "invalid" };

      const base = createEmptyCoverLetterDocument();
      const recipientName = arg(action, "recipientName");
      const salutation = arg(action, "salutation");

      return {
        ok: true,
        proposal: {
          tool: action.tool,
          summary: `Draft a cover letter: ${title}`,
          effect: {
            kind: "coverLetter",
            title,
            document: {
              ...base,
              recipient: {
                ...base.recipient,
                name: recipientName,
                company: arg(action, "company"),
              },
              subject: arg(action, "subject"),
              salutation: salutation || base.salutation,
              body,
              closing: arg(action, "closing") || base.closing,
              signature: arg(action, "signature"),
            },
          },
        },
      };
    }
  }
}

/* -------------------------------------------------------------------------
 * Insights path
 *
 * Insights holds the document already, so it can show a real before/after
 * instead of a description. That extra information is worth a second entry
 * point rather than flattening both surfaces to the weaker one.
 * ---------------------------------------------------------------------- */

export interface ActionPreview {
  tool: AgentToolName;
  before: string;
  after: string;
  apply: (document: ResumeDocument) => ResumeDocument | null;
}

export type ActionOutcome =
  | { ok: true; preview: ActionPreview }
  | { ok: false; blocker: ActionBlocker };

/** Insights already produces exactly this proposal — it just never applied it. */
export function weakPhraseAction(weak: WeakPhrase): ProposedAction {
  return {
    tool: "resume.replacePhrase",
    args: {
      blockId: weak.blockId,
      phrase: weak.phrase,
      suggestion: weak.suggestion,
    },
  };
}

export function previewAction(
  document: ResumeDocument,
  action: ProposedAction,
): ActionOutcome {
  if (action.tool !== "resume.replacePhrase") {
    return { ok: false, blocker: "invalid" };
  }

  const blockId = arg(action, "blockId");
  const phrase = arg(action, "phrase");
  const suggestion = arg(action, "suggestion");
  if (!blockId || !phrase || !suggestion) {
    return { ok: false, blocker: "invalid" };
  }

  const target = resolveBlockTarget(document, blockId);
  if (!target) return { ok: false, blocker: "unsupported" };

  const before = readTarget(document, target);
  const next = replacePhraseAt(document, target, phrase, suggestion);
  if (!next) return { ok: false, blocker: "changed" };

  return {
    ok: true,
    preview: {
      tool: action.tool,
      before,
      after: readTarget(next, target),
      // Re-resolved against whatever document is current at click time, not
      // the one this preview was built from.
      apply: (live) => {
        const at = resolveBlockTarget(live, blockId);
        return at ? replacePhraseAt(live, at, phrase, suggestion) : null;
      },
    },
  };
}
