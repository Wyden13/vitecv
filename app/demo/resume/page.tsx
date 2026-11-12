"use client";

import { useState } from "react";

import EditorHeader, { type EditorTab } from "@/components/resume/EditorHeader";
import PreviewPane from "@/components/resume/PreviewPane";
import ResumePreview from "@/components/resume/ResumePreview";
import SectionList from "@/components/resume/SectionList";
import SplitPane from "@/components/resume/SplitPane";
import { DEMO_NOW } from "@/data/demoFixtures";
import { SAMPLE_RESUME } from "@/data/sampleDocuments";

export default function DemoResumePage() {
  const [document, setDocument] = useState(SAMPLE_RESUME);
  const [title, setTitle] = useState("Frontend · Northwind Labs");
  const [tab, setTab] = useState<EditorTab>("editor");

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        title={title}
        onTitleChange={setTitle}
        activeTab={tab}
        onTabChange={setTab}
        onDownload={() => {}}
        saving={false}
        savedAt={new Date(DEMO_NOW)}
        error={null}
      />
      <SplitPane
        storageKey="vitecv:demo-split"
        label="Resize editor and preview"
        primary={<SectionList document={document} onChange={setDocument} />}
        secondary={
          <PreviewPane>
            <ResumePreview document={document} />
          </PreviewPane>
        }
      />
    </div>
  );
}
