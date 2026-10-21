export type ChatRole = "user" | "assistant";

export interface ChatAttachment {
  name: string;
  /** Extracted body. Sent to the model; never rendered in the transcript. */
  text: string;
}

export const MAX_ATTACHMENTS = 5;

/** Combined across one message, matching the model budget used elsewhere. */
export const MAX_ATTACHMENT_CHARS = 12_000;

export interface ChatMessageRecord {
  id: string;
  role: ChatRole;
  content: string;
  attachments: ChatAttachment[];
  /** Empty strings rather than null — Firestore round-trips them cleanly. */
  suggestLabel: string;
  suggestHref: string;
  createdAt: Date | null;
}

/**
 * The chat composer's `useActionState` shape. It lives here, not in
 * `actions/chat-action.ts`: a `"use server"` module may only export async
 * functions, so a plain object constant there is a build error.
 */
export interface ChatTurnState {
  error: string;
}

export const EMPTY_TURN: ChatTurnState = { error: "" };

export interface AgentSuggestion {
  label: string;
  href: string;
}

export interface AgentReply {
  reply: string;
  suggest: AgentSuggestion | null;
}

/**
 * The only destinations the agent may propose.
 *
 * This is a whitelist, not a hint: `suggest.href` is written by a language
 * model and rendered as a link the user is invited to click. An unchecked value
 * would let model output — which can be steered by anything pasted into the
 * chat — put an arbitrary URL in the user's own UI. Anything not on this list
 * drops the suggestion entirely.
 */
export const SUGGESTABLE_ROUTES = [
  "/resume",
  "/cv",
  "/job-match",
  "/insights",
  "/job-tracker",
] as const;

export const ROUTE_PURPOSE: Record<string, string> = {
  "/resume": "write and edit resumes",
  "/cv": "write cover letters",
  "/job-match": "compare a resume against a job posting",
  "/insights": "see what a resume emphasises and where it is weak",
  "/job-tracker": "track applications and their next actions",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * A trust boundary, not a formality. Attachment text is extracted in the
 * browser and posted back as a form value, so by the time the server sees it
 * the count, the size and the types are all client-controlled. Anything past
 * the caps is dropped rather than forwarded to the model.
 */
export function normalizeAttachments(value: unknown): ChatAttachment[] {
  if (!Array.isArray(value)) return [];

  const kept: ChatAttachment[] = [];
  let chars = 0;

  for (const entry of value) {
    if (kept.length === MAX_ATTACHMENTS) break;
    if (!entry || typeof entry !== "object") continue;

    const raw = entry as Record<string, unknown>;
    const name = text(raw.name);
    const body = typeof raw.text === "string" ? raw.text : "";
    if (!name || !body.trim()) continue;

    if (chars + body.length > MAX_ATTACHMENT_CHARS) break;

    chars += body.length;
    kept.push({ name, text: body });
  }

  return kept;
}

function asSuggestion(value: unknown): AgentSuggestion | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const href = text(raw.href);
  const label = text(raw.label);

  const allowed = SUGGESTABLE_ROUTES.find((route) => route === href);
  if (!allowed || !label) return null;

  return { label, href: allowed };
}

export function normalizeAgentReply(value: unknown): AgentReply {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    reply: text(raw.reply),
    suggest: asSuggestion(raw.suggest),
  };
}
