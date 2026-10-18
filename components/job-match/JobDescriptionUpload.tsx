"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";

import { extractFileText } from "@/libs/extractFile";
import { SpinnerIcon, UploadIcon } from "../icons";
import { useToast } from "../Toast";

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function validate(file: File): string | null {
  const extension = file.name
    .substring(file.name.lastIndexOf("."))
    .toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return "Only PDF and DOCX files are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 5 MB.";
  }

  return null;
}

export interface JobDescriptionUploadProps {
  onText: (text: string) => void;
  disabled?: boolean;
}

/**
 * Fills the description textarea from a file.
 *
 * `extractFileText` runs a pdf.js worker and `DOMParser`, so this has to stay on
 * the client — the text reaches the server only when the user runs the match.
 */
export default function JobDescriptionUpload({
  onText,
  disabled = false,
}: JobDescriptionUploadProps) {
  const { notify, update } = useToast();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const blocked = disabled || busy;

  const accept = async (file: File) => {
    const failure = validate(file);
    if (failure) {
      setError(failure);
      return;
    }

    setError("");
    setBusy(true);

    const id = notify({
      variant: "loading",
      message: `Reading ${file.name}…`,
      duration: 0,
    });

    try {
      const text = await extractFileText(file);

      if (!text.trim()) {
        throw new Error("No readable text found in this file.");
      }

      onText(text);
      update(id, {
        variant: "success",
        message: `Loaded ${file.name}`,
        duration: 4000,
      });
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not read this file.";
      setError(message);
      update(id, { variant: "error", message, duration: 4000 });
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    // Cleared so picking the same file twice still fires a change event.
    event.target.value = "";
    if (selected) void accept(selected);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);

    if (blocked) return;

    const dropped = event.dataTransfer.files?.[0];
    if (dropped) void accept(dropped);
  };

  return (
    <div className="flex flex-col">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!blocked) setDragging(true);
        }}
        onDragLeave={(event) => {
          // Ignore the events that bubble up from children.
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center gap-1 rounded-md border border-dashed px-3 py-4 text-sm transition-colors focus-within:ring-2 focus-within:ring-accent ${
          blocked
            ? "cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
            : dragging
              ? "cursor-pointer border-accent bg-accent-subtle text-accent"
              : "cursor-pointer border-accent-border text-accent hover:bg-accent-subtle"
        }`}
      >
        {busy ? (
          <SpinnerIcon className="size-4 animate-spin" />
        ) : (
          <UploadIcon className="size-4" />
        )}
        <span className="font-medium">{busy ? "Reading…" : "Upload"}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          PDF or DOCX, up to 5 MB
        </span>

        <input
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          disabled={blocked}
          aria-describedby={error ? "jd-upload-error" : undefined}
          className="sr-only"
        />
      </label>

      {error && (
        <p
          id="jd-upload-error"
          className="mt-2 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
