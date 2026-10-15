import InsightsPanel from "@/components/insights/InsightsPanel";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";

export default function InsightPage() {
  return (
    <PageShell header="Insights" actions={<UserMenu />}>
      <div className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            What your resume says
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Pick a resume and have it read for keywords — what it emphasises,
            how heavily, and where each term actually comes from.
          </p>
        </div>

        <div className="mt-6">
          <InsightsPanel />
        </div>
      </div>
    </PageShell>
  );
}
