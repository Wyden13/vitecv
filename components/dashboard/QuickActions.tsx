import Link from "next/link";

import CreateCoverLetterButton from "../coverletter/CreateCoverLetterButton";
import {
  BriefcaseIcon,
  FileTextIcon,
  LayoutGridIcon,
  PlusIcon,
  UploadIcon,
} from "../icons";
import OptionCard from "../OptionCard";
import CreateResumeButton from "../resume/CreateResumeButton";
import ResumeUpload from "../ResumeUpload";

const LINK_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900";

export default function QuickActions() {
  return (
    <section>
      <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Quick actions
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Jump straight to the thing you came here for.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OptionCard
          icon={UploadIcon}
          tone="accent"
          badge="Recommended"
          title="Upload my resume"
          description="Bring a PDF or DOCX and we will pull it apart into editable sections."
          action={<ResumeUpload />}
        />

        <OptionCard
          icon={PlusIcon}
          title="Create a resume"
          description="Start from an empty document and build it section by section."
          action={<CreateResumeButton />}
        />

        <OptionCard
          icon={FileTextIcon}
          title="Write a cover letter"
          description="Open a fresh cover letter and tailor it to the role you are chasing."
          action={<CreateCoverLetterButton />}
        />

        <OptionCard
          icon={BriefcaseIcon}
          title="Match a job"
          description="Paste a posting to see what it asks for and how much you already evidence."
          action={
            <Link href="/job-match" className={LINK_CLASS}>
              <BriefcaseIcon className="size-4" />
              Open Job Match
            </Link>
          }
        />

        <OptionCard
          icon={LayoutGridIcon}
          title="Resume insights"
          description="See what your resume emphasises and where the wording goes soft."
          action={
            <Link href="/insights" className={LINK_CLASS}>
              <LayoutGridIcon className="size-4" />
              Open Insights
            </Link>
          }
        />

        <OptionCard
          icon={BriefcaseIcon}
          title="Track applications"
          description="Keep every role you are chasing, and what you owe it next, in one board."
          action={
            <Link href="/job-tracker" className={LINK_CLASS}>
              <BriefcaseIcon className="size-4" />
              Open Job Tracker
            </Link>
          }
        />
      </div>
    </section>
  );
}
