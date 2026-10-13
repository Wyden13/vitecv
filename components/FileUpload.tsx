"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import Button from "./Button";
import { UploadIcon } from "./icons";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/** Shared by the picker and the drop target; returns null when the file is valid. */
function validate(file: File): string | null {
  const extension = file.name
    .substring(file.name.lastIndexOf("."))
    .toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return "Only PDF, DOC, and DOCX files are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 5 MB.";
  }

  return null;
}

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [dragging, setDragging] = useState(false);

  const accept = (selected: File) => {
    const message = validate(selected);

    if (message) {
      setError(message);
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    accept(selectedFile);
    // Reset so re-picking the same file fires `change` again.
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);

    const dropped = event.dataTransfer.files?.[0];
    if (dropped) accept(dropped);
  };

  if (file) {
    return (
      <div className="flex flex-col">
        <div className="w-full rounded-md border border-accent-border bg-accent-subtle px-3 py-2 text-left">
          <p className="truncate text-sm font-medium text-accent">{file.name}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>

        <Button variant="soft" className="mt-2 w-full" disabled>
          Continue
        </Button>

        <button
          type="button"
          onClick={() => {
            setFile(null);
            setError("");
          }}
          className="mt-1 text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Choose another file
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          // Ignore leave events fired by the icon/text inside the label.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={`flex w-full cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed px-3 py-4 text-sm transition-colors focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 ${
          dragging
            ? "border-accent bg-accent-subtle text-accent"
            : "border-accent-border text-accent hover:bg-accent-subtle"
        }`}
      >
        <UploadIcon className="size-4" />
        <span className="font-medium">Upload</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          or drop a file here
        </span>

        <input
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          aria-describedby={error ? "file-upload-error" : undefined}
          className="sr-only"
        />
      </label>

      {error && (
        <p
          id="file-upload-error"
          role="alert"
          className="mt-2 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
