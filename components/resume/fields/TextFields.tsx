"use client";

import type { SimpleLabels } from "@/libs/resume/sectionPresets";
import { TextAreaField } from "./Field";

export interface TextFieldsProps {
  value: string;
  onChange: (next: string) => void;
  labels: SimpleLabels;
}

export function TextFields({ value, onChange, labels }: TextFieldsProps) {
  return (
    <TextAreaField
      label={labels.field}
      value={value}
      onChange={onChange}
      placeholder={labels.placeholder}
    />
  );
}

export interface ListFieldsProps {
  value: string[];
  onChange: (next: string[]) => void;
  labels: SimpleLabels;
}

export function ListFields({ value, onChange, labels }: ListFieldsProps) {
  return (
    <TextAreaField
      label={labels.field}
      value={value.join("\n")}
      onChange={(next) => onChange(next.split("\n"))}
      placeholder={labels.placeholder}
    />
  );
}
