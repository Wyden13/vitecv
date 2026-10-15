"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";

import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { extractFileText } from "@/libs/extractFile";
import { importResumeText } from "@/libs/resume/parse/importResume";
import { createResume } from "@/libs/resume/resumeService";
import { UploadIcon } from "./icons";
import { useToast } from "./Toast";
import { useUploadProgress } from "./UploadProgress";

// Kept in sync with `extractFileText`, which handles exactly these two.
// Legacy .doc is excluded deliberately: mammoth cannot read it, so allowing it
// here would pass validation and then fail during extraction.
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/** Shared by the picker and the drop target; returns null when the file is valid. */
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

export default function ResumeUpload() {
  const router = useRouter();
  const { user, loading } = useFirebaseUser();
  const { notify, update, dismiss } = useToast();
  const { setStage, reset: resetProgress, isProcessing } = useUploadProgress();

  const [error, setError] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const toastId = useRef<string | null>(null);

  const disabled = isProcessing || loading || !user;

  const accept = async (selected: File) => {
    if (isProcessing) return;

    if (!user) {
      setError("You must be signed in to upload a resume.");
      return;
    }

    setStage("validating");
    const message = validate(selected);

    if (message) {
      setError(message);
      setStage("failed");

      if (toastId.current) {
        dismiss(toastId.current);
        toastId.current = null;
      }
      notify({ variant: "error", message });
      return;
    }

    setError("");

    const id = notify({
      variant: "loading",
      message: `Uploading ${selected.name}…`,
      duration: 0,
    });
    toastId.current = id;

    try {
      setStage("extracting");
      const rawText = await extractFileText(selected);

      if (!rawText.trim()) {
        throw new Error("No readable text found in this file.");
      }

      setStage("structuring");
      const imported = await importResumeText(rawText);

      setStage("saving");
      const resumeId = await createResume(user.uid, {
        fileName: selected.name,
        rawText,
        document: imported.document,
      });

      setStage("completed");
      update(id, {
        variant: "success",
        message:
          imported.usedFallback || imported.leftovers > 0
            ? "Imported — check the sections, some content is under \"Other\"."
            : "Resume processed successfully",
        duration: imported.usedFallback || imported.leftovers > 0 ? 6000 : 4000,
      });

      router.push(`/resume/${resumeId}`);
    } catch (caught) {
      const failure =
        caught instanceof Error ? caught.message : "Failed to process resume.";

      setStage("failed");
      setError(failure);
      update(id, { variant: "error", message: failure, duration: 4000 });
    } finally {
      toastId.current = null;
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    // Reset so re-picking the same file fires `change` again.
    event.target.value = "";

    if (selectedFile) void accept(selectedFile);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);

    if (disabled) return;

    const dropped = event.dataTransfer.files?.[0];
    if (dropped) void accept(dropped);
  };

  return (
    <div className="flex flex-col">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          // Ignore leave events fired by the icon/text inside the label.
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center gap-1 rounded-md border border-dashed px-3 py-4 text-sm transition-colors focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 ${disabled
            ? "cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
            : dragging
              ? "cursor-pointer border-accent bg-accent-subtle text-accent"
              : "cursor-pointer border-accent-border text-accent hover:bg-accent-subtle"
          }`}
      >
        <UploadIcon className="size-4" />
        <span className="font-medium">Upload</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {loading
            ? "Checking your session…"
            : user
              ? "or drop a resume here"
              : "Sign in to upload"}
        </span>

        <input
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          disabled={disabled}
          aria-describedby={error ? "resume-upload-error" : undefined}
          className="sr-only"
        />
      </label>

      {error && (
        <div className="mt-2 flex flex-col items-start gap-1">
          <p
            id="resume-upload-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              setError("");
              resetProgress();
            }}
            className="text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Try another file
          </button>
        </div>
      )}
    </div>
  );
}
