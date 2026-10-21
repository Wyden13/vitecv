"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { startChat } from "@/actions/chat-action";
import { useAttachments } from "@/hooks/useAttachments";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { ALLOWED_EXTENSIONS, UPLOAD_HINT } from "@/libs/uploadFile";

import AttachmentChips from "../chat/AttachmentChips";
import Button from "../Button";
import { ArrowUpIcon, PlusIcon, SpinnerIcon } from "../icons";
import { useToast } from "../Toast";

const PLACEHOLDER =
  "Paste a job posting, or describe what you want to work on…";

export default function PromptComposer() {
  const router = useRouter();
  const { user, loading } = useFirebaseUser();
  const { notify } = useToast();

  const fieldId = useId();
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const { attachments, reading, add, remove } = useAttachments();

  const busy = reading || thinking;
  const empty = !text.trim() && attachments.length === 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || empty || busy) return;

    setThinking(true);
    try {
      await startChat(text, attachments);
      router.push("/chat");
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not start a chat.",
      });
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-accent-border bg-background p-2 shadow-sm"
      >
        <label htmlFor={fieldId} className="sr-only">
          What would you like to do?
        </label>
        <textarea
          id={fieldId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={PLACEHOLDER}
          rows={2}
          // field-sizing grows the box with its content, no JS needed.
          className="field-sizing-content max-h-64 w-full resize-none bg-transparent px-3 py-3 text-left text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
        />

        {attachments.length > 0 && (
          <div className="px-3 pb-2">
            <AttachmentChips attachments={attachments} onRemove={remove} />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 px-1 pb-1">
          <label
            title={UPLOAD_HINT}
            className={`inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs transition-colors ${
              busy
                ? "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                : "cursor-pointer text-zinc-600 hover:bg-accent-subtle hover:text-accent dark:text-zinc-400"
            }`}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-accent-subtle text-accent">
              {reading ? (
                <SpinnerIcon className="size-4 animate-spin" />
              ) : (
                <PlusIcon className="size-4" />
              )}
            </span>
            {reading ? "Reading…" : "docx or pdf"}
            <input
              type="file"
              multiple
              accept={ALLOWED_EXTENSIONS.join(",")}
              onChange={(event) => void add(event)}
              disabled={busy}
              className="sr-only"
            />
          </label>

          <Button
            type="submit"
            size="lg"
            disabled={loading || !user || busy || empty}
            iconRight={
              thinking ? (
                <SpinnerIcon className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="size-4" />
              )
            }
          >
            {thinking ? "Thinking…" : "Get started"}
          </Button>
        </div>
      </form>
    </div>
  );
}
