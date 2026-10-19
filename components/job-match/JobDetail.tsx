import {
  hasJobSections,
  type JobSections,
} from "@/libs/insights/insightSchema";

import { CARD, SectionHeading } from "./shared";

export interface JobDetailProps {
  sections: JobSections;
  description: string;
}

const SECTION_ORDER: { key: keyof JobSections; title: string }[] = [
  { key: "responsibilities", title: "Responsibilities" },
  { key: "qualifications", title: "Qualifications" },
  { key: "niceToHave", title: "Nice to have" },
  { key: "benefits", title: "Benefits" },
];

function RawPosting({ description }: { description: string }) {
  return (
    <div className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
      {description}
    </div>
  );
}

export default function JobDetail({ sections, description }: JobDetailProps) {
  if (!hasJobSections(sections) && !description.trim()) {
    return (
      <div className={`${CARD} text-sm text-zinc-500 dark:text-zinc-400`}>
        The posting this match was run against is no longer in view. Paste it
        again to read the detail.
      </div>
    );
  }
  if (!hasJobSections(sections)) {
    return (
      <div className={`${CARD} flex flex-col gap-2`}>
        <SectionHeading
          title="Job description"
          hint="This posting did not break into sections, so here it is as written."
        />
        <RawPosting description={description} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {SECTION_ORDER.map(({ key, title }) => {
        const entries = sections[key];
        if (entries.length === 0) return null;

        return (
          <div key={key} className={CARD}>
            <SectionHeading title={title} count={entries.length} />

            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
              {entries.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>
        );
      })}

      {description.trim() && (
        <details className={CARD}>
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            Original posting
          </summary>

          <div className="mt-3">
            <RawPosting description={description} />
          </div>
        </details>
      )}
    </div>
  );
}
