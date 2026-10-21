"use server";

import { revalidatePath } from "next/cache";

import {
  EMPTY_TURN,
  normalizeAgentReply,
  normalizeAttachments,
  type ChatAttachment,
  type ChatTurnState,
} from "@/libs/chat/chatSchema";
import {
  appendMessage,
  readThread,
  resetThread,
} from "@/libs/chat/chatService";
import { chatMessages } from "@/libs/chat/prompts";
import { requireUser } from "@/libs/dal";
import { callGlmJson } from "@/libs/insights/glm";

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

async function runTurn(
  uid: string,
  text: string,
  attachments: ChatAttachment[],
): Promise<void> {
  await appendMessage(uid, { role: "user", content: text, attachments });
  const history = await readThread(uid);
  const { data } = await callGlmJson(chatMessages(history));
  const answer = normalizeAgentReply(data);

  await appendMessage(uid, {
    role: "assistant",
    content:
      answer.reply ||
      "I could not put an answer together for that. Try rephrasing it?",
    suggestLabel: answer.suggest?.label,
    suggestHref: answer.suggest?.href,
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

export async function clearChat(): Promise<void> {
  const user = await requireUser();

  await resetThread(user.uid);
  revalidatePath("/chat");
}
