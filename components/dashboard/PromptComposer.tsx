"use client";

import { useId, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { routePrompt } from "@/actions/dashboard-action";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { createCoverLetter } from "@/libs/coverletter/coverLetterService";
import type { PromptRoute } from "@/libs/dashboard/intentSchema";
import { extractFileText } from "@/libs/extractFile";
import { setHandoff } from "@/libs/handoff";
import {
  ALLOWED_EXTENSIONS,
  UPLOAD_HINT,
  validateUpload,
} from "@/libs/uploadFile";

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
  const [reading, setReading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [question, setQuestion] = useState("");

  const busy = reading || thinking;

  const attach = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;

    const invalid = validateUpload(selected);
    if (invalid) {
      notify({ variant: "error", message: invalid });
      return;
    }

    setReading(true);
    try {
      const extracted = await extractFileText(selected);
      if (!extracted.trim()) {
        throw new Error("No readable text found in this file.");
      }
      setText((current) =>
        current.trim() ? `${current.trim()}\n\n${extracted}` : extracted,
      );
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error ? caught.message : "Could not read that file.",
      });
    } finally {
      setReading(false);
    }
  };

  const follow = async (route: PromptRoute) => {
    switch (route.intent) {
      case "jobMatch":
        setHandoff({
          jobDescription: route.jobDescription || text,
          role: route.role,
        });
        router.push("/job-match");
        return;

      case "coverLetter": {
        if (!user) return;
        const id = await createCoverLetter(user.uid, {
          title: route.role ? `Cover letter — ${route.role}` : undefined,
        });
        router.push(`/cv/${id}`);
        return;
      }

      case "resume":
        router.push("/resume");
        return;

      case "insights":
        setHandoff({ role: route.role });
        router.push("/insights");
        return;

      case "tracker":
        router.push("/job-tracker");
        return;

      case "unclear":
        setQuestion(
          route.note || "Tell me a little more about what you need.",
        );
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !text.trim() || busy) return;

    setThinking(true);
    setQuestion("");
    try {
      await follow(await routePrompt(text));
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not work out what to do with that.",
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
              accept={ALLOWED_EXTENSIONS.join(",")}
              onChange={(event) => void attach(event)}
              disabled={busy}
              className="sr-only"
            />
          </label>

          <Button
            type="submit"
            size="lg"
            disabled={loading || !user || busy || !text.trim()}
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

      {question && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {question}
        </p>
      )}
    </div>
  );
}
