import Link from "next/link";

import CoverLetterList from "@/components/coverletter/CoverLetterList";
import CreateCoverLetterButton from "@/components/coverletter/CreateCoverLetterButton";
import OptionCard from "@/components/OptionCard";
import PageShell from "@/components/layouts/PageShell";
import UserMenu from "@/components/layouts/UserMenu";
import { LayoutGridIcon, PlusIcon } from "@/components/icons";

export default function CoverLetterPage() {
  return (
    <PageShell header="Cover Letter" actions={<UserMenu />}>
      <div className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Start a cover letter
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Write one from scratch, or pick a layout that matches the resume you
            are sending with it.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <OptionCard
            icon={PlusIcon}
            title="Create a cover letter"
            description="Start from a blank formal letter, with the sender, recipient and closing already structured for you."
            action={<CreateCoverLetterButton />}
          />
          <OptionCard
            icon={LayoutGridIcon}
            tone="accent"
            title="Browse templates"
            description="Compare letter layouts side by side, including one that pairs with the Modern resume."
            action={
              <Link
                href="/cv/templates"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-subtle px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-subtle-hover"
              >
                <LayoutGridIcon className="size-4" />
                Browse
              </Link>
            }
          />
        </div>

        <div className="mt-10">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            My cover letters
          </h2>
          <CoverLetterList />
        </div>
      </div>
    </PageShell>
  );
}
