import { Suspense } from "react";

import ChatComposer from "@/components/chat/ChatComposer";
import ClearChatButton from "@/components/chat/ClearChatButton";
import MessageList from "@/components/chat/MessageList";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";
import { readThread } from "@/libs/chat/chatService";
import { requireUser } from "@/libs/dal";

function TranscriptSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="h-12 w-2/3 self-end rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-24 w-5/6 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}

/**
 * The transcript is read and rendered on the server — no websocket, no client
 * fetch. Its own Suspense boundary is required, not cosmetic: `getCurrentUser`
 * is `"use cache: private"` and `cacheComponents` is on, so an unwrapped read
 * fails the build. The layout's shared boundary has `fallback={null}`, which
 * would blank the whole pane.
 */
async function Transcript() {
  const user = await requireUser();
  const messages = await readThread(user.uid);

  if (messages.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center text-center">
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Ask about your resume, paste a job posting, or describe the role you
          are after — the assistant will point you at the right tool.
        </p>
      </div>
    );
  }

  return <MessageList messages={messages} />;
}

export default function ChatPage() {
  return (
    <PageShell header="Assistant" actions={<UserMenu />}>
      <div className="mx-auto flex h-full max-w-3xl flex-col">
        <div className="flex justify-end pb-2">
          <ClearChatButton />
        </div>

        <div className="flex-1 pb-6">
          <Suspense fallback={<TranscriptSkeleton />}>
            <Transcript />
          </Suspense>
        </div>

        <div className="sticky bottom-0">
          <ChatComposer />
        </div>
      </div>
    </PageShell>
  );
}
