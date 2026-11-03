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
  /** Write actions the assistant proposed on this turn, awaiting confirmation. */
  actions: StoredAction[];
  createdAt: Date | null;
}

/**
 * A proposed action as it sits in Firestore between being suggested and being
 * confirmed — or not.
 *
 * `summary` is stored rather than recomputed because it is also what the model
 * is shown on later turns: rebuilding it would mean re-resolving documents
 * that may since have changed, to describe something that already happened.
 */
export type ActionState = "proposed" | "applied" | "skipped" | "failed";

export const ACTION_STATES: ActionState[] = [
  "proposed",
  "applied",
  "skipped",
  "failed",
];

export interface StoredAction {
  tool: string;
  args: Record<string, string | string[]>;
  summary: string;
  state: ActionState;
}

/** One turn should not be able to bury the transcript in buttons. */
export const MAX_ACTIONS = 5;

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

/**
 * The same whitelist check as before, now exported: with tool calling the
 * route suggestion arrives as a tool argument rather than a JSON field, but it
 * is still model-written text rendered as a link, so it is still checked here.
 */
export function asSuggestion(value: unknown): AgentSuggestion | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const href = text(raw.href);
  const label = text(raw.label);

  const allowed = SUGGESTABLE_ROUTES.find((route) => route === href);
  if (!allowed || !label) return null;

  return { label, href: allowed };
}

function argValue(value: unknown): string | string[] | null {
  if (Array.isArray(value)) {
    const list = value.map(text).filter(Boolean);
    return list.length > 0 ? list : null;
  }

  const line = text(value);
  return line || null;
}

function asState(value: unknown): ActionState {
  return ACTION_STATES.find((state) => state === value) ?? "proposed";
}

/**
 * Read back from Firestore, where the shape is only as good as whatever wrote
 * it. Total, like every other `normalize*` here: a malformed entry is dropped
 * rather than rendered as a button that cannot work.
 */
export function normalizeStoredActions(value: unknown): StoredAction[] {
  if (!Array.isArray(value)) return [];

  const kept: StoredAction[] = [];

  for (const entry of value) {
    if (kept.length === MAX_ACTIONS) break;
    if (!entry || typeof entry !== "object") continue;

    const raw = entry as Record<string, unknown>;
    const tool = text(raw.tool);
    const summary = text(raw.summary);
    if (!tool || !summary) continue;

    const source = (raw.args ?? {}) as Record<string, unknown>;
    const args: Record<string, string | string[]> = {};

    for (const [key, item] of Object.entries(source)) {
      const parsed = argValue(item);
      if (parsed !== null) args[key] = parsed;
    }

    kept.push({ tool, args, summary, state: asState(raw.state) });
  }

  return kept;
}
