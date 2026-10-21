"use client";

import { useEffect, useState } from "react";

import {
  createExtensionToken,
  getExtensionToken,
} from "@/actions/extension-action";
import type { ExtensionTokenInfo } from "@/libs/jobtracker/extensionToken";

import Button from "../Button";
import { useToast } from "../Toast";

/**
 * Pairs the browser extension with this account.
 *
 * The extension cannot ride the session cookie (`SameSite=Lax` is not sent on
 * a cross-site POST), so it carries a bearer token instead. Only the hash is
 * stored, which is why the token is shown once and then only by prefix.
 */
export default function ExtensionPairing() {
  const { notify } = useToast();

  const [info, setInfo] = useState<ExtensionTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getExtensionToken()
      .then((value) => {
        if (active) setInfo(value);
      })
      .catch(() => {
        if (active) setInfo(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const generate = async () => {
    setWorking(true);

    try {
      const { token, info: next } = await createExtensionToken();

      setRevealed(token);
      setInfo(next);
      notify({
        variant: "success",
        message: "Extension token generated. Copy it now.",
      });
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not generate a token.",
      });
    } finally {
      setWorking(false);
    }
  };

  const copy = async () => {
    if (!revealed) return;

    try {
      await navigator.clipboard.writeText(revealed);
      notify({ variant: "success", message: "Token copied." });
    } catch {
      notify({
        variant: "error",
        message: "Could not copy — select the token and copy it manually.",
      });
    }
  };

  const created = info?.createdAt
    ? new Date(info.createdAt).toLocaleDateString()
    : null;

  return (
    <section className="rounded-xl border border-zinc-200 px-3 py-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Browser extension
          </h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {loading
              ? "Checking pairing…"
              : info
                ? `Paired with ${info.prefix}…${created ? ` · created ${created}` : ""}`
                : "Generate a token and paste it into the extension to save jobs straight from a posting."}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={working || loading}
          onClick={() => void generate()}
        >
          {working
            ? "Generating…"
            : info
              ? "Regenerate token"
              : "Generate token"}
        </Button>
      </div>

      {revealed && (
        <div className="mt-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-2.5 py-2 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Copy this now — only its hash is stored, so it cannot be shown
            again.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded bg-background px-2 py-1 font-mono text-xs text-zinc-900 dark:text-zinc-50">
              {revealed}
            </code>

            <Button variant="ghost" size="sm" onClick={() => void copy()}>
              Copy
            </Button>
          </div>
        </div>
      )}

      {info && !revealed && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          Regenerating revokes the token the extension is using — you will need
          to paste the new one into the popup.
        </p>
      )}
    </section>
  );
}
