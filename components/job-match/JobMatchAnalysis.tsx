import { type RoleGapItem } from "@/libs/insights/insightSchema";

import { CARD, Chip, SectionHeading } from "./shared";

export interface JobMatchAnalysisProps {
  matched: RoleGapItem[];
  missing: RoleGapItem[];
}

function SkillColumn({
  title,
  hint,
  items,
}: {
  title: string;
  hint: string;
  items: RoleGapItem[];
}) {
  return (
    <div className="min-w-0 flex-1">
      <SectionHeading title={title} count={items.length} hint={hint} />

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">None.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <Chip key={item.term} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function JobMatchAnalysis({
  matched,
  missing,
}: JobMatchAnalysisProps) {
  return (
    <div className={`${CARD} flex flex-wrap gap-8`}>
      <SkillColumn
        title="Matched skills"
        hint="Your resume already evidences these."
        items={matched}
      />
      <SkillColumn
        title="Missing skills"
        hint="Asked for, but not found in your resume."
        items={missing}
      />
    </div>
  );
}
