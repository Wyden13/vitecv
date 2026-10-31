"use server";

import { revalidatePath } from "next/cache";

import {
  buildAction,
  normalizeAction,
  type ProposedAction,
} from "@/libs/agent/actions";
import {
  agentContextMessage,
  readAgentContext,
  type AgentContext,
} from "@/libs/agent/context";
import {
  AGENT_TOOL_SCHEMAS,
  SUGGEST_ROUTE_TOOL,
  toAgentTool,
} from "@/libs/agent/tools";
import {
  asSuggestion,
  EMPTY_TURN,
  MAX_ACTIONS,
  normalizeAttachments,
  type ActionState,
  type AgentSuggestion,
  type ChatAttachment,
  type ChatTurnState,
  type StoredAction,
} from "@/libs/chat/chatSchema";
import {
  appendMessage,
  readThread,
  resetThread,
  setActionState,
} from "@/libs/chat/chatService";
import { chatMessages } from "@/libs/chat/prompts";
import { requireUser } from "@/libs/dal";
import { callGlmTools, type GlmToolCall } from "@/libs/insights/glm";

const MAX_MESSAGE_CHARS = 12_000;

function readAttachmentField(formData: FormData): unknown {
  const raw = formData.get("attachments");
  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function titlesOf(context: AgentContext): Record<string, string> {
  return Object.fromEntries(
    context.resumes.map((entry) => [entry.id, entry.title]),
  );
}

/**
 * Turns the model's tool calls into stored proposals.
 *
 * Three filters, in order: the name must map to a registry tool
 * (`toAgentTool`), the arguments must normalize (`normalizeAction`), and the
 * result must build into something applicable (`buildAction`). A call failing
 * any of them is dropped rather than stored — an unusable card is worse than
 * no card, and the prose half of the reply still stands on its own.
 */
function collectProposals(
  calls: GlmToolCall[],
  context: AgentContext,
): { actions: StoredAction[]; suggestion: AgentSuggestion | null } {
  const titles = titlesOf(context);
  const actions: StoredAction[] = [];
  let suggestion: AgentSuggestion | null = null;

  for (const call of calls) {
    if (call.name === SUGGEST_ROUTE_TOOL) {
      suggestion = suggestion ?? asSuggestion(call.arguments);
      continue;
    }

    if (actions.length === MAX_ACTIONS) continue;

    const tool = toAgentTool(call.name);
    if (!tool) continue;

    const action: ProposedAction | null = normalizeAction({
      tool,
      args: call.arguments,
    });
    if (!action) continue;

    const built = buildAction(action, titles);
    if (!built.ok) continue;

    actions.push({
      tool: action.tool,
      args: action.args,
      summary: built.proposal.summary,
      state: "proposed",
    });
  }

  return { actions, suggestion };
}

async function runTurn(
  uid: string,
  text: string,
  attachments: ChatAttachment[],
): Promise<void> {
  await appendMessage(uid, { role: "user", content: text, attachments });

  const [history, context] = await Promise.all([
    readThread(uid),
    readAgentContext(uid),
  ]);

  const { content, toolCalls } = await callGlmTools(
    chatMessages(history, agentContextMessage(context)),
    AGENT_TOOL_SCHEMAS,
  );

  const { actions, suggestion } = collectProposals(toolCalls, context);

  // A turn that proposes an edit but says nothing would render as a bare
  // button with no explanation, so the cards supply their own wording.
  const fallback =
    actions.length > 0
      ? "Here is what I can change — review it before applying."
      : "I could not put an answer together for that. Try rephrasing it?";

  await appendMessage(uid, {
    role: "assistant",
    content: content || fallback,
    suggestLabel: suggestion?.label,
    suggestHref: suggestion?.href,
    actions,
  });
}

/** Opens a fresh conversation, replacing whatever was there. */
export async function startChat(
  text: string,
  attachments?: unknown,
): Promise<void> {
  const user = await requireUser();

  const message = typeof text === "string" ? text.trim() : "";
  const files = normalizeAttachments(attachments);

  if (!message && files.length === 0) {
    throw new Error("Type something or attach a file to start a chat.");
  }

  await resetThread(user.uid);
  await runTurn(user.uid, message.slice(0, MAX_MESSAGE_CHARS), files);

  revalidatePath("/chat");
}

export async function sendMessage(
  _previous: ChatTurnState,
  formData: FormData,
): Promise<ChatTurnState> {
  const user = await requireUser();

  const message = String(formData.get("message") ?? "").trim();
  const files = normalizeAttachments(readAttachmentField(formData));

  if (!message && files.length === 0) {
    return { error: "Type a message or attach a file first." };
  }

  try {
    await runTurn(user.uid, message.slice(0, MAX_MESSAGE_CHARS), files);
  } catch (caught) {
    revalidatePath("/chat");
    return {
      error:
        caught instanceof Error
          ? caught.message
          : "The assistant could not reply. Try again.",
    };
  }

  revalidatePath("/chat");
  return EMPTY_TURN;
}

/**
 * Records the outcome of a proposal after the browser has carried it out.
 *
 * The write itself happens client-side under `firestore.rules`; this only
 * marks what became of it, keeping every chat-thread write in the admin-SDK
 * path that already owns the transcript.
 */
export async function markAction(
  messageId: string,
  index: number,
  state: ActionState,
): Promise<void> {
  const user = await requireUser();

  await setActionState(user.uid, messageId, index, state);
  revalidatePath("/chat");
}

export async function clearChat(): Promise<void> {
  const user = await requireUser();

  await resetThread(user.uid);
  revalidatePath("/chat");
}
