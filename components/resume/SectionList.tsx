"use client";

import { useState, type DragEvent } from "react";

import {
  SECTION_LABELS,
  type ResumeDocument,
  type SectionKind,
  type TimelineSectionKind,
} from "@/libs/resumeSchema";
import SectionCard from "./SectionCard";
import ProfileFields from "./fields/ProfileFields";
import SkillFields from "./fields/SkillFields";
import TimelineFields from "./fields/TimelineFields";

const TIMELINE_LABELS: Record<
  TimelineSectionKind,
  { title: string; subtitle: string; meta: string; addLabel: string }
> = {
  education: {
    title: "School",
    subtitle: "Program",
    meta: "Credential / GPA",
    addLabel: "Add education",
  },
  experience: {
    title: "Company",
    subtitle: "Role",
    meta: "Location / type",
    addLabel: "Add experience",
  },
  projects: {
    title: "Project",
    subtitle: "Role / context",
    meta: "Tech stack",
    addLabel: "Add project",
  },
  certificates: {
    title: "Certificate",
    subtitle: "Issuer",
    meta: "Credential ID",
    addLabel: "Add certificate",
  },
};

export interface SectionListProps {
  document: ResumeDocument;
  onChange: (next: ResumeDocument) => void;
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export default function SectionList({ document, onChange }: SectionListProps) {
  const [draggingKind, setDraggingKind] = useState<SectionKind | null>(null);
  const [dropTarget, setDropTarget] = useState<SectionKind | null>(null);

  const { sectionOrder } = document;

  const reorder = (from: number, to: number) => {
    onChange({ ...document, sectionOrder: move(sectionOrder, from, to) });
  };

  const handleDrop = (kind: SectionKind) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDropTarget(null);

    if (!draggingKind || draggingKind === kind) return;

    reorder(sectionOrder.indexOf(draggingKind), sectionOrder.indexOf(kind));
    setDraggingKind(null);
  };

  const renderFields = (kind: SectionKind) => {
    if (kind === "profile") {
      return (
        <ProfileFields
          value={document.profile}
          onChange={(profile) => onChange({ ...document, profile })}
        />
      );
    }

    if (kind === "skills") {
      return (
        <SkillFields
          value={document.skills}
          onChange={(skills) => onChange({ ...document, skills })}
        />
      );
    }

    return (
      <TimelineFields
        value={document[kind]}
        onChange={(entries) => onChange({ ...document, [kind]: entries })}
        labels={TIMELINE_LABELS[kind]}
      />
    );
  };

  return (
    <div className="flex flex-col">
      {sectionOrder.map((kind, index) => (
        <SectionCard
          key={kind}
          title={SECTION_LABELS[kind].title}
          hint={SECTION_LABELS[kind].hint}
          canMoveUp={index > 0}
          canMoveDown={index < sectionOrder.length - 1}
          onMoveUp={() => reorder(index, index - 1)}
          onMoveDown={() => reorder(index, index + 1)}
          isDragging={draggingKind === kind}
          isDropTarget={dropTarget === kind && draggingKind !== kind}
          onDragStart={(event) => {
            setDraggingKind(kind);
            event.dataTransfer.effectAllowed = "move";
            // Firefox refuses to start a drag without payload.
            event.dataTransfer.setData("text/plain", kind);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDropTarget(kind);
          }}
          onDrop={handleDrop(kind)}
          onDragEnd={() => {
            setDraggingKind(null);
            setDropTarget(null);
          }}
        >
          {renderFields(kind)}
        </SectionCard>
      ))}
    </div>
  );
}
