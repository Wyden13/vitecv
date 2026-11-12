"use client";

import { useEffect, useState } from "react";

import {
  createPairingCode,
  disconnectExtension,
  getExtensionToken,
} from "@/actions/extension-action";
import type { ExtensionTokenInfo } from "@/libs/jobtracker/extensionToken";

import Button from "../Button";
import SuccessCheck from "../motion/SuccessCheck";
import { useToast } from "../Toast";

const CARD =
  "rounded-xl border border-zinc-200 bg-background px-5 py-4 dark:border-zinc-800";
const TITLE =
  "text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50";
const MUTED = "text-sm text-zinc-600 dark:text-zinc-400";

export default function ExtensionConnect() {
  const { notify } = useToast();

  const [info, setInfo] = useState<ExtensionTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [code, setCode] = useState<string | null>(null);

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

  // The extension redeems the code out of band; poll until a new pairing shows up.
  useEffect(() => {
    if (!code) return;

    const timer = setInterval(() => {
      getExtensionToken()
        .then((next) => {
          if (next && next.prefix !== info?.prefix) {
            setInfo(next);
            setCode(null);
            notify({ variant: "success", message: "Browser connected." });
          }
        })
        .catch(() => undefined);
    }, 4000);

    return () => clearInterval(timer);
  }, [code, info, notify]);

  const getCode = async () => {
    setWorking(true);

    try {
      const next = await createPairingCode();

      setCode(next.code);
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error ? caught.message : "Could not get a code.",
      });
    } finally {
      setWorking(false);
    }
  };

  const copy = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      notify({ variant: "success", message: "Code copied." });
    } catch {
      notify({
        variant: "error",
        message: "Could not copy — select the code and copy it manually.",
      });
    }
  };

  const disconnect = async () => {
    setWorking(true);

    try {
      await disconnectExtension();
      setInfo(null);
      notify({ variant: "success", message: "Browser disconnected." });
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error ? caught.message : "Could not disconnect.",
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <section className={CARD}>
        <h2 className={TITLE}>Connect this browser</h2>
        <p className={MUTED}>Chrome only for now.</p>
        <p className={`mt-3 ${MUTED}`}>
          Install the extension, open a job posting, click the viteCV tab on the
          right edge of the page and enter the code below. A code works once
          and expires after 10 minutes.
        </p>

        {code && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
            <code className="font-mono text-xl font-semibold tracking-widest text-zinc-900 dark:text-zinc-50">
              {code}
            </code>
            <span className="text-xs text-zinc-500">
              Expires in 10 minutes
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => void copy()}
            >
              Copy
            </Button>
          </div>
        )}

        <Button
          variant="primary"
          className="mt-3"
          disabled={working || loading}
          onClick={() => void getCode()}
        >
          {working
            ? "Getting code…"
            : code
              ? "Get a new code"
              : "Get a connection code"}
        </Button>
      </section>

      <section className={CARD}>
        <h2 className={TITLE}>Connected browsers</h2>
        <p className={MUTED}>
          Disconnecting signs that browser&apos;s extension out at once.
        </p>

        {loading ? (
          <p className={`mt-3 ${MUTED}`}>Checking…</p>
        ) : info ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-zinc-900 dark:text-zinc-50">
              <SuccessCheck className="size-9 shrink-0" label="Connected" />
              <div>
                <code className="font-mono">{info.prefix}…</code>
                <p className="text-xs text-zinc-500">
                  Connected{" "}
                  {info.createdAt
                    ? new Date(info.createdAt).toLocaleDateString()
                    : "recently"}
                  {" · "}
                  {info.lastUsedAt
                    ? `last used ${new Date(info.lastUsedAt).toLocaleString()}`
                    : "not used yet"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={working}
              onClick={() => void disconnect()}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <p className={`mt-3 ${MUTED}`}>No browsers connected yet.</p>
        )}
      </section>

      <section className={CARD}>
        <h2 className={TITLE}>What the extension can do</h2>
        <div className={`mt-3 flex flex-col gap-2 ${MUTED}`}>
          <p>
            It reads job postings you open and saves the ones you choose to your
            Job Tracker.
          </p>
          <p>AI can make mistakes. Please review the work before applying.</p>
        </div>
      </section>
    </div>
  );
}
