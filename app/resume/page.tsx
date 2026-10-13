import FileUpload from "@/components/FileUpload";
import OptionCard from "@/components/OptionCard";
import PageShell from "@/components/PageShell";
import { LinkedInIcon, PlusIcon, UploadIcon } from "@/components/icons";

export default function ResumePage() {
  return (
    <PageShell header="Resume Builder">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Start your resume
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Build one from scratch, bring an existing file, or pull your profile
            straight from LinkedIn.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <OptionCard
            icon={PlusIcon}
            title="Create a new resume"
            description="Step-by-step ATS guidance and AI tools to write your resume, including your summary, section by section."
            actionLabel="Create"
          />
          <OptionCard
            icon={UploadIcon}
            tone="accent"
            badge="Recommended"
            title="Upload my resume"
            description="Let AI strengthen your bullet points, rewrite your summary, and improve every section."
            action={<FileUpload />}
          />
          {/*<OptionCard
            icon={LinkedInIcon}
            tone="accentAlt"
            title="Import from LinkedIn"
            description="AI polishes your bullet points and summary to match every section, recruiter-ready."
            actionLabel="Import"
          />*/}
        </div>
      </div>
    </PageShell>
  );
}
