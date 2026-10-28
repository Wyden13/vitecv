"use client";

import { useState, type DragEvent } from "react";

import {
  createSection,
  type ResumeDocument,
  type ResumeSection,
} from "@/libs/resume/resumeSchema";
import {
  getSectionPreset,
  presetForLayout,
  type SectionPreset,
} from "@/libs/resume/sectionPresets";
import {
  applyLibraryPull,
  type LibraryPick,
} from "@/libs/library/libraryPull";
import AddSectionPanel from "./AddSectionPanel";
import LibraryProfileButton from "./LibraryProfileButton";
import LibraryPullSheet from "./LibraryPullSheet";
import SectionCard from "./SectionCard";
import ProfileFields from "./fields/ProfileFields";
import SkillFields from "./fields/SkillFields";
import { ListFields, TextFields } from "./fields/TextFields";
import TimelineFields from "./fields/TimelineFields";

const PROFILE_HINT =
  "Include email, phone & portfolio for easy employer access.";

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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [pullOpen, setPullOpen] = useState(false);

  const { sections } = document;

  const setSections = (next: ResumeSection[]) =>
    onChange({ ...document, sections: next });

  const reorder = (from: number, to: number) =>
    setSections(move(sections, from, to));

  const replace = (section: ResumeSection) =>
    setSections(
      sections.map((candidate) =>
        candidate.id === section.id ? section : candidate,
      ),
    );

  const addSection = (preset: SectionPreset, heading?: string) =>
    setSections([...sections, createSection(preset, heading)]);

  const handleDrop = (id: string) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDropTargetId(null);

    if (!draggingId || draggingId === id) return;

    reorder(
      sections.findIndex((section) => section.id === draggingId),
      sections.findIndex((section) => section.id === id),
    );
    setDraggingId(null);
  };

  const renderFields = (section: ResumeSection) => {
    switch (section.layout) {
      case "timeline":
        return (
          <TimelineFields
            value={section.entries}
            onChange={(entries) => replace({ ...section, entries })}
            labels={presetForLayout(section.presetId, "timeline").labels}
          />
        );

      case "skills":
        return (
          <SkillFields
            value={section.groups}
            onChange={(groups) => replace({ ...section, groups })}
            labels={presetForLayout(section.presetId, "skills").labels}
          />
        );

      case "text":
        return (
          <TextFields
            value={section.body}
            onChange={(body) => replace({ ...section, body })}
            labels={presetForLayout(section.presetId, "text").labels}
          />
        );

      case "list":
        return (
          <ListFields
            value={section.items}
            onChange={(items) => replace({ ...section, items })}
            labels={presetForLayout(section.presetId, "list").labels}
          />
        );
    }
  };

  return (
    <div className="flex flex-col">
      <SectionCard heading="Profile Info" hint={PROFILE_HINT}>
        <div className="flex flex-col gap-3">
          <LibraryProfileButton
            profile={document.profile}
            onChange={(profile) => onChange({ ...document, profile })}
          />
          <ProfileFields
            value={document.profile}
            onChange={(profile) => onChange({ ...document, profile })}
          />
        </div>
      </SectionCard>

      {sections.map((section, index) => (
        <SectionCard
          key={section.id}
          heading={section.heading}
          hint={getSectionPreset(section.presetId, section.layout).hint}
          onHeadingChange={(heading) => replace({ ...section, heading })}
          onRemove={() =>
            setSections(
              sections.filter((candidate) => candidate.id !== section.id),
            )
          }
          canMoveUp={index > 0}
          canMoveDown={index < sections.length - 1}
          onMoveUp={() => reorder(index, index - 1)}
          onMoveDown={() => reorder(index, index + 1)}
          isDragging={draggingId === section.id}
          isDropTarget={dropTargetId === section.id && draggingId !== section.id}
          onDragStart={(event) => {
            setDraggingId(section.id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", section.id);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDropTargetId(section.id);
          }}
          onDrop={handleDrop(section.id)}
          onDragEnd={() => {
            setDraggingId(null);
            setDropTargetId(null);
          }}
        >
          {renderFields(section)}
        </SectionCard>
      ))}

      <AddSectionPanel
        usedPresetIds={sections.map((section) => section.presetId)}
        onAdd={addSection}
        onPullFromLibrary={() => setPullOpen(true)}
      />

      <LibraryPullSheet
        open={pullOpen}
        document={document}
        onClose={() => setPullOpen(false)}
        onPull={(picks: LibraryPick[]) => {
          onChange(applyLibraryPull(document, picks));
          setPullOpen(false);
        }}
      />
    </div>
  );
}
