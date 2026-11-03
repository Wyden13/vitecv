import type { ChatMessageRecord } from "@/libs/chat/chatSchema";

import MessageActions from "../agent/MessageActions";
import AttachmentChips from "./AttachmentChips";
import SuggestLink from "./SuggestLink";

/**
 * Rendered on the server — this is the part that makes the chat SSR rather
 * than a client app that happens to be served by Next.
 */
function Bubble({
  message,
  context,
}: {
  message: ChatMessageRecord;
  context: string;
}) {
  const mine = message.role === "user";

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex flex-col gap-2 ${mine ? "items-end max-w-[85%]" : "max-w-[90%]"}`}
      >
        {message.content && (
          <div
            className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              mine
                ? "bg-accent-subtle text-accent"
                : "border border-zinc-200 bg-background text-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Filenames only — the extracted body stays out of the transcript. */}
        <AttachmentChips attachments={message.attachments} />

        {/* Client island: the write has to happen in the browser, under
            firestore.rules, even though this transcript is server-rendered. */}
        {!mine && (
          <MessageActions messageId={message.id} actions={message.actions} />
        )}

        {!mine && message.suggestHref && message.suggestLabel && (
          <SuggestLink
            label={message.suggestLabel}
            href={message.suggestHref}
            context={context}
          />
        )}
      </div>
    </div>
  );
}

export default function MessageList({
  messages,
}: {
  messages: ChatMessageRecord[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <Bubble
          key={message.id}
          message={message}
          // The user turn this reply answers, for the Job Match handoff.
          context={
            message.role === "assistant"
              ? (messages[index - 1]?.content ?? "")
              : ""
          }
        />
      ))}
    </div>
  );
}
