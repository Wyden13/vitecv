"use client";

import { createSkillGroup, type SkillGroup } from "@/libs/resume/resumeSchema";
import type { SkillsLabels } from "@/libs/resume/sectionPresets";
import Button from "../../Button";
import { PlusIcon, TrashIcon } from "../../icons";
import { Field } from "./Field";

export interface SkillFieldsProps {
  value: SkillGroup[];
  onChange: (next: SkillGroup[]) => void;
  labels: SkillsLabels;
}

export default function SkillFields({
  value,
  onChange,
  labels,
}: SkillFieldsProps) {
  const replace = (index: number, group: SkillGroup) => {
    const next = [...value];
    next[index] = group;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.map((group, index) => (
        <div key={group.id} className="flex items-end gap-2">
          <div className="w-40 shrink-0">
            <Field
              label={labels.group}
              value={group.group}
              onChange={(next) => replace(index, { ...group, group: next })}
              placeholder="Languages"
            />
          </div>
          <div className="min-w-0 flex-1">
            <Field
              label={labels.items}
              value={group.items.join(", ")}
              onChange={(next) =>
                replace(index, {
                  ...group,
                  items: next.split(",").map((item) => item.trim()),
                })
              }
              placeholder="Java, TypeScript, Python"
            />
          </div>
          <button
            type="button"
            aria-label={`Remove skill group ${group.group || index + 1}`}
            onClick={() =>
              onChange(value.filter((candidate) => candidate.id !== group.id))
            }
            className="mb-1 rounded p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      ))}

      <Button
        variant="soft"
        size="sm"
        className="self-start"
        icon={<PlusIcon className="size-4" />}
        onClick={() => onChange([...value, createSkillGroup()])}
      >
        {labels.addLabel}
      </Button>
    </div>
  );
}
