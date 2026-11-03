"use client";

import { useId } from "react";

/**
 * The error state swaps the border class rather than appending one: two
 * `border-*` utilities on the same element are decided by Tailwind's
 * stylesheet order, not by the order they appear in the class string.
 */
const INPUT_BASE =
  "w-full rounded-md bg-background px-2.5 py-1.5 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 focus:outline-none focus:ring-2 dark:text-zinc-50";

const INPUT_IDLE =
  "border border-zinc-200 focus:ring-zinc-900 " +
  "dark:border-zinc-800 dark:focus:ring-zinc-100";

const INPUT_ERROR =
  "border border-red-400 focus:ring-red-500 " +
  "dark:border-red-800 dark:focus:ring-red-500";

function inputClass(error: string | undefined, extra = ""): string {
  return [INPUT_BASE, error ? INPUT_ERROR : INPUT_IDLE, extra]
    .filter(Boolean)
    .join(" ");
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
    >
      {children}
      {required && (
        <span aria-hidden className="ml-0.5 text-accent-alt">
          *
        </span>
      )}
    </label>
  );
}

function Message({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  // An error replaces the hint rather than stacking under it: two lines of
  // small print below one input is noise, and the error is the urgent one.
  const message = error ?? hint;
  if (!message) return null;

  return (
    <p
      id={id}
      className={`text-xs ${
        error
          ? "text-red-600 dark:text-red-400"
          : "text-zinc-500 dark:text-zinc-400"
      }`}
    >
      {message}
    </p>
  );
}

export interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url" | "date" | "number";
  /** Shown in red under the input, and sets `aria-invalid`. */
  error?: string;
  /** Quiet helper text under the input. Hidden while `error` is set. */
  hint?: string;
  /** Adds a `*` to the label. Validation itself stays with the caller. */
  required?: boolean;
  /** Fired on blur so a form can decide a field has been "visited". */
  onBlur?: () => void;
  max?: string;
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  hint,
  required,
  onBlur,
  max,
}: FieldProps) {
  const id = useId();
  const messageId = useId();

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        type={type}
        value={value}
        max={max}
        placeholder={placeholder}
        // Not the native `required`: that pops the browser's own bubble and
        // pre-empts the inline message the caller is trying to show.
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={(error ?? hint) ? messageId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={inputClass(error)}
      />
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

export interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  hint?: string;
  onBlur?: () => void;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  hint,
  onBlur,
}: TextAreaFieldProps) {
  const id = useId();
  const messageId = useId();

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={(error ?? hint) ? messageId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={inputClass(error, "resize-y")}
      />
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}
