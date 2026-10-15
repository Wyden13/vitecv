"use client";

import type { ResumeProfile } from "@/libs/resume/resumeSchema";
import { createId } from "@/libs/resume/resumeSchema";
import Button from "../../Button";
import { PlusIcon, TrashIcon } from "../../icons";
import { Field } from "./Field";

export interface ProfileFieldsProps {
  value: ResumeProfile;
  onChange: (next: ResumeProfile) => void;
}

export default function ProfileFields({ value, onChange }: ProfileFieldsProps) {
  const set = <K extends keyof ResumeProfile>(
    key: K,
    next: ResumeProfile[K],
  ) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Full name"
          value={value.name}
          onChange={(next) => set("name", next)}
          placeholder="Wendy Nguyen"
        />
        <Field
          label="Headline"
          value={value.title}
          onChange={(next) => set("title", next)}
          placeholder="Software Developer"
        />
        <Field
          label="Email"
          type="email"
          value={value.email}
          onChange={(next) => set("email", next)}
          placeholder="you@example.com"
        />
        <Field
          label="Phone"
          type="tel"
          value={value.phone}
          onChange={(next) => set("phone", next)}
          placeholder="+1 555 000 0000"
        />
        <Field
          label="Location"
          value={value.location}
          onChange={(next) => set("location", next)}
          placeholder="Calgary, AB"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Links
        </span>

        {value.links.map((link, index) => (
          <div key={link.id} className="flex items-end gap-2">
            <div className="w-32 shrink-0">
              <Field
                label="Label"
                value={link.label}
                onChange={(next) => {
                  const links = [...value.links];
                  links[index] = { ...link, label: next };
                  set("links", links);
                }}
                placeholder="LinkedIn"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Field
                label="URL"
                type="url"
                value={link.url}
                onChange={(next) => {
                  const links = [...value.links];
                  links[index] = { ...link, url: next };
                  set("links", links);
                }}
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <button
              type="button"
              aria-label={`Remove link ${link.label || index + 1}`}
              onClick={() =>
                set(
                  "links",
                  value.links.filter((candidate) => candidate.id !== link.id),
                )
              }
              className="mb-1 rounded p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        ))}

        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          icon={<PlusIcon className="size-4" />}
          onClick={() =>
            set("links", [
              ...value.links,
              { id: createId(), label: "", url: "" },
            ])
          }
        >
          Add link
        </Button>
      </div>
    </div>
  );
}
