import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";
import TemplateGallery from "@/components/templates/TemplateGallery";

export default function CoverLetterTemplatesPage() {
  return (
    <PageShell header="Templates" actions={<UserMenu />}>
      <div className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pick a letter layout
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Every template shows the same sample letter, so you are comparing
            layout rather than wording. You can switch at any time from the
            Style tab.
          </p>
        </div>

        <div className="mt-6">
          <TemplateGallery defaultFilter="coverLetter" />
        </div>
      </div>
    </PageShell>
  );
}
