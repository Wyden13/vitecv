import PageShell from "@/components/layouts/PageShell";
import TemplateGallery from "@/components/templates/TemplateGallery";

import DemoAvatar from "../DemoAvatar";

export default function DemoTemplatesPage() {
  return (
    <PageShell header="Templates" actions={<DemoAvatar />}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Pick a starting point
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Every template shows the same sample content, so you are comparing
          layout rather than wording.
        </p>
        <div className="mt-6">
          <TemplateGallery defaultFilter="resume" />
        </div>
      </div>
    </PageShell>
  );
}
