import { groupByTier, type RoleGapItem } from "@/libs/insights/insightSchema";

import { CARD, Chip, SectionHeading } from "./shared";

export interface ImproveGuidelineProps {
  items: RoleGapItem[];
}

export default function ImproveGuideline({ items }: ImproveGuidelineProps) {
  const groups = groupByTier(items.filter((item) => !item.present));

  if (groups.length === 0) {
    return (
      <div className={`${CARD} text-sm text-zinc-600 dark:text-zinc-400`}>
        Nothing to add — your resume already evidences everything this posting
        asks for.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map(({ tier, items: missing }) => (
        <div key={tier.min} className={CARD}>
          <SectionHeading
            title={tier.title}
            count={missing.length}
            hint={tier.advice}
          />

          <div className="mt-2 flex flex-wrap gap-2">
            {missing.map((item) => (
              <Chip key={item.term} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
