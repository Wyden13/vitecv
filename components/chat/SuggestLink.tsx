"use client";

import { useRouter } from "next/navigation";

import { setHandoff } from "@/libs/handoff";

import Button from "../Button";
import { ArrowUpIcon } from "../icons";

export interface SuggestLinkProps {
  label: string;
  href: string;
  /** The message this suggestion answers — carried into Job Match. */
  context: string;
}

export default function SuggestLink({
  label,
  href,
  context,
}: SuggestLinkProps) {
  const router = useRouter();

  const go = () => {
    // Job Match can use the posting directly, so hand it over rather than
    // dropping the user on an empty textarea.
    if (href === "/job-match" && context.trim()) {
      setHandoff({ jobDescription: context });
    }

    router.push(href);
  };

  return (
    <Button
      variant="soft"
      size="sm"
      className="mt-3"
      onClick={go}
      iconRight={<ArrowUpIcon className="size-3.5 rotate-90" />}
    >
      {label}
    </Button>
  );
}
