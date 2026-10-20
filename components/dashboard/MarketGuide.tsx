"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { marketGuidance } from "@/actions/dashboard-action";
import type { MarketGuidance } from "@/libs/dashboard/intentSchema";
import { setHandoff } from "@/libs/handoff";

import Button from "../Button";
import { AlertTriangleIcon, MapPinIcon, SpinnerIcon } from "../icons";
import { Field } from "../resume/fields/Field";
import { useToast } from "../Toast";

function Pills({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md bg-accent-subtle px-2 py-1 text-sm text-accent"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MarketGuide() {
  const router = useRouter();
  const { notify } = useToast();

  const [location, setLocation] = useState("");
  const [pending, setPending] = useState(false);
  const [guidance, setGuidance] = useState<MarketGuidance | null>(null);

  const run = async () => {
    if (!location.trim() || pending) return;

    setPending(true);
    try {
      setGuidance(await marketGuidance(location));
    } catch (caught) {
      notify({
        variant: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Could not read that market.",
      });
    } finally {
      setPending(false);
    }
  };

  const matchAgainst = () => {
    if (!guidance) return;

    setHandoff({ role: guidance.titles.join(", ") });
    router.push("/job-match");
  };

  const empty =
    guidance && guidance.titles.length === 0 && guidance.skills.length === 0;

  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Explore a job market
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        See the roles and skills a place tends to ask for, so you know what to
        aim your resume at.
      </p>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-background p-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <Field
              label="City or region"
              value={location}
              onChange={setLocation}
              placeholder="Ho Chi Minh City"
            />
          </div>
          <Button
            onClick={() => void run()}
            disabled={pending || !location.trim()}
            icon={
              pending ? (
                <SpinnerIcon className="size-4 animate-spin" />
              ) : (
                <MapPinIcon className="size-4" />
              )
            }
          >
            {pending ? "Reading…" : "Show me"}
          </Button>
        </div>

        {/*
          Permanent, not conditional on the result: this is a language model
          describing a market from training data, and it must never be read as
          a list of live openings.
        */}
        <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <AlertTriangleIcon className="size-3.5 shrink-0 translate-y-px" />
          AI guidance from a language model — general knowledge about a market,
          not live job listings.
        </p>

        {guidance && (
          <div className="mt-5 flex flex-col gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            {empty ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {guidance.note ||
                  `Nothing reliable to say about ${guidance.location}.`}
              </p>
            ) : (
              <>
                <Pills title="Common titles" items={guidance.titles} />
                <Pills title="Frequently asked for" items={guidance.skills} />

                {guidance.note && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {guidance.note}
                  </p>
                )}

                <Button
                  variant="soft"
                  size="sm"
                  className="self-start"
                  onClick={matchAgainst}
                >
                  Match my resume against this
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
