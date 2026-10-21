"use client";

import {
  useActionState,
  useEffect,
  useRef,
  type ChangeEvent,
} from "react";
import { useFormStatus } from "react-dom";

import { sendMessage } from "@/actions/chat-action";
import { useAttachments } from "@/hooks/useAttachments";
import { EMPTY_TURN } from "@/libs/chat/chatSchema";
import { ALLOWED_EXTENSIONS, UPLOAD_HINT } from "@/libs/uploadFile";

import AttachmentChips from "./AttachmentChips";
import Button from "../Button";
import { ArrowUpIcon, PlusIcon, SpinnerIcon } from "../icons";

function SubmitRow({
  reading,
  onPick,
}: {
  reading: boolean;
  onPick: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  // `useFormStatus` has to live in a child of the <form> to see it.
  const { pending } = useFormStatus();
  const busy = pending || reading;

  return (
    <div className="flex items-center justify-between gap-3 px-1 pb-1">
      <label
        title={UPLOAD_HINT}
        className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs transition-colors ${
          busy
            ? "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
            : "cursor-pointer text-zinc-600 hover:bg-accent-subtle hover:text-accent dark:text-zinc-400"
        }`}
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-accent-subtle text-accent">
          {reading ? (
            <SpinnerIcon className="size-3.5 animate-spin" />
          ) : (
            <PlusIcon className="size-3.5" />
          )}
        </span>
        {reading
          ? "Reading…"
          : pending
            ? "Thinking — this can take a moment."
            : "Attach"}
        <input
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={onPick}
          disabled={busy}
          className="sr-only"
        />
      </label>

      <Button
        type="submit"
        disabled={busy}
        iconRight={
          pending ? (
            <SpinnerIcon className="size-4 animate-spin" />
          ) : (
            <ArrowUpIcon className="size-4" />
          )
        }
      >
        {pending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}

export default function ChatComposer() {
  const [state, action] = useActionState(sendMessage, EMPTY_TURN);
  const { attachments, reading, add, remove, clear } = useAttachments();
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Focus follows the conversation: after a turn resolves, the box is ready
  // for the next message.
  useEffect(() => {
    fieldRef.current?.focus();
    // The turn is over, so the chips have been sent — React 19 resets the
    // form itself, but the chip state is ours to clear.
    clear();
  }, [state, clear]);

  return (
    <div className="border-t border-zinc-200 bg-background px-4 py-3 dark:border-zinc-800">
      {/*
        No manual reset: React 19 clears an uncontrolled form itself once a
        form action resolves. Resetting in onSubmit would race the FormData
        serialisation.
      */}
      <form
        ref={formRef}
        action={action}
        className="rounded-2xl border border-accent-border bg-background p-2"
      >
        <label htmlFor="chat-message" className="sr-only">
          Message the assistant
        </label>
        <textarea
          id="chat-message"
          name="message"
          ref={fieldRef}
          rows={2}
          placeholder="Ask about your resume, or attach a document…"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          className="field-sizing-content max-h-48 w-full resize-none bg-transparent px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
        />

        {attachments.length > 0 && (
          <div className="px-3 pb-2">
            <AttachmentChips attachments={attachments} onRemove={remove} />
          </div>
        )}

        <input
          type="hidden"
          name="attachments"
          value={JSON.stringify(
            attachments.map(({ name, text }) => ({ name, text })),
          )}
        />

        <SubmitRow reading={reading} onPick={(event) => void add(event)} />
      </form>

      {state.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  );
}
