"use client";

import { useState, useTransition } from "react";

import { clearChat } from "@/actions/chat-action";

export default function ClearChatButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded px-2 py-1 text-xs text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Clear chat
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await clearChat();
            setConfirming(false);
          })
        }
        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        {pending ? "Clearing…" : "Clear"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Cancel
      </button>
    </span>
  );
}
