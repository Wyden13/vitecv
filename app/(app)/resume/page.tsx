import Link from "next/link";

import ResumeUpload from "@/components/ResumeUpload";
import CreateResumeButton from "@/components/resume/CreateResumeButton";
import ResumeList from "@/components/resume/ResumeList";
import OptionCard from "@/components/OptionCard";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";
import {
  UploadProgressBar,
  UploadProgressProvider,
} from "@/components/UploadProgress";
import { LayoutGridIcon, PlusIcon, UploadIcon } from "@/components/icons";

export default function ResumePage() {
  return (
    <UploadProgressProvider>
      <PageShell
        header="Resume Builder"
        actions={<UserMenu />}
        progress={<UploadProgressBar />}
      >
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Start your resume
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Build one from scratch, bring an existing file, or pull your
              profile straight from LinkedIn.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <OptionCard
              icon={PlusIcon}
              title="Create a new resume"
              description="Step-by-step ATS guidance and AI tools to write your resume, including your summary, section by section."
              action={<CreateResumeButton />}
            />
            <OptionCard
              icon={UploadIcon}
              tone="accent"
              badge="Recommended"
              title="Upload my resume"
              description="Let AI strengthen your bullet points, rewrite your summary, and improve every section."
              action={<ResumeUpload />}
            />
            <OptionCard
              icon={LayoutGridIcon}
              title="Browse templates"
              description="Compare every resume and cover letter layout side by side, then start from the one that fits."
              action={
                <Link
                  href="/resume/templates"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
                >
                  <LayoutGridIcon className="size-4" />
                  Browse
                </Link>
              }
            />
          </div>

          <div className="mt-10">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              My resumes
            </h2>
            <ResumeList />
          </div>
        </div>
      </PageShell>
    </UploadProgressProvider>
  );
}
