"use client";

import { useState } from "react";

import { markAction } from "@/actions/chat-action";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { buildAction, normalizeAction } from "@/libs/agent/actions";
import type { TransformFailure } from "@/libs/agent/transforms";
import type { StoredAction } from "@/libs/chat/chatSchema";
import { createCoverLetter } from "@/libs/coverletter/coverLetterService";
import { createJobApplication } from "@/libs/jobtracker/jobTrackerService";
import { getResume, updateResume } from "@/libs/resume/resumeService";

import { useToast } from "../Toast";
import ActionCard from "./ActionCard";

/**
 * The client half of the pipeline: the server proposed, the browser writes.
 *
 * It has to be the browser. Every domain service here uses the client Firebase
 * SDK, and `firestore.rules` — matched against the browser's auth state — is
 * what actually keeps one user's documents away from another's. Writing these
 * server-side would mean the admin SDK, which bypasses those rules entirely.
 */

const FAILURE_COPY: Record<TransformFailure, string> = {
  missing: "That part of the resume is not there any more.",
  changed: "That wording has changed since this was suggested.",
  redundant: "That is already in your resume.",
  invalid: "That suggestion was incomplete.",
};

export interface MessageActionsProps {
  messageId: string;
  actions: StoredAction[];
}

export default function MessageActions({
  messageId,
  actions,
}: MessageActionsProps) {
  const { user } = useFirebaseUser();
  const { notify } = useToast();
  const [busy, setBusy] = useState<number | null>(null);

  if (actions.length === 0) return null;

  const apply = async (action: StoredAction, index: number) => {
    if (!user) return;

    const parsed = normalizeAction({ tool: action.tool, args: action.args });
    const built = parsed ? buildAction(parsed, {}) : null;

    if (!built?.ok) {
      notify({ variant: "error", message: "This suggestion is no longer valid." });
      await markAction(messageId, index, "failed");
      return;
    }

    setBusy(index);

    try {
      const { effect } = built.proposal;

      if (effect.kind === "resume") {
        const record = await getResume(user.uid, effect.resumeId);

        if (!record) {
          notify({ variant: "error", message: "That resume no longer exists." });
          await markAction(messageId, index, "failed");
          return;
        }

        // Re-checked against the document as it is now, not as it was when
        // the suggestion was written.
        const result = effect.apply(record.document);

        if (!result.ok) {
          notify({ variant: "error", message: FAILURE_COPY[result.reason] });
          await markAction(messageId, index, "failed");
          return;
        }

        await updateResume(user.uid, effect.resumeId, {
          document: result.document,
        });
      } else if (effect.kind === "jobApplication") {
        await createJobApplication(user.uid, effect.input);
      } else {
        await createCoverLetter(user.uid, {
          title: effect.title,
          document: effect.document,
        });
      }

      await markAction(messageId, index, "applied");
      notify({ variant: "success", message: "Applied" });
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error ? caught.message : "Could not apply that.",
      });
      await markAction(messageId, index, "failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="mt-1 flex w-full flex-col gap-2">
      {actions.map((action, index) => (
        <ActionCard
          key={`${messageId}-${index}`}
          title="Proposed change"
          description={action.summary}
          applying={busy === index}
          done={action.state === "proposed" ? undefined : action.state}
          onApply={() => void apply(action, index)}
          onSkip={() => void markAction(messageId, index, "skipped")}
        />
      ))}
    </ul>
  );
}
