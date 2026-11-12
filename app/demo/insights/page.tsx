"use client";

import { useState } from "react";

import KeywordViews, {
  KEYWORD_VIEWS,
  type KeywordView,
} from "@/components/insights/KeywordViews";
import RoleGap from "@/components/insights/RoleGap";
import SignalCards from "@/components/insights/SignalCards";
import PageShell from "@/components/layouts/PageShell";
import ViewSwitcher from "@/components/ViewSwitcher";
import { DEMO_KEYWORDS, DEMO_ROLE_GAP } from "@/data/demoFixtures";
import { SAMPLE_RESUME } from "@/data/sampleDocuments";

import DemoAvatar from "../DemoAvatar";

const BLOCKS = new Map();
const SECTION =
  "rounded-xl border border-zinc-200 bg-background p-5 dark:border-zinc-800";

export default function DemoInsightsPage() {
  const [view, setView] = useState<KeywordView>("cloud");
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <PageShell header="Insights" actions={<DemoAvatar />}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className={`${SECTION} flex flex-col gap-5`}>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            What your resume says
          </h2>
          <SignalCards
            keywords={DEMO_KEYWORDS}
            signals={{ bulletCount: 14, quantifiedCount: 9, weakPhrases: [] }}
            blocks={BLOCKS}
            document={SAMPLE_RESUME}
            stale={false}
            applyingKey={null}
            onApply={() => {}}
          />
          <ViewSwitcher
            options={KEYWORD_VIEWS}
            value={view}
            onChange={setView}
            label="Keyword views"
          />
          <KeywordViews
            keywords={DEMO_KEYWORDS}
            view={view}
            blocks={BLOCKS}
            selectedTerm={selected}
            onSelect={(keyword) =>
              setSelected((current) =>
                current === keyword.term ? null : keyword.term,
              )
            }
          />
        </section>

        <section className={SECTION}>
          <h2 className="mb-4 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Gap to a role
          </h2>
          <RoleGap gap={DEMO_ROLE_GAP} pending={false} onRun={() => {}} />
        </section>
      </div>
    </PageShell>
  );
}
