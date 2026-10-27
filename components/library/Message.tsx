import type { ReactNode } from "react";

/**
 * The loading / empty / error line the library's panes share. Elsewhere in the
 * app this helper is copied per file; one copy serves the whole feature here.
 */
export default function Message({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <p
      className={`text-sm ${
        tone === "error"
          ? "text-red-600 dark:text-red-400"
          : "text-zinc-600 dark:text-zinc-400"
      }`}
    >
      {children}
    </p>
  );
}
