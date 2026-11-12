import Link from "next/link";

import { buttonClasses } from "@/components/Button";
import {
  BriefcaseIcon,
  FileTextIcon,
  LayoutGridIcon,
  PencilIcon,
  SparkleIcon,
  UploadIcon,
} from "@/components/icons";
import Logo from "@/components/Logo";
import { SPARKLE_24 } from "@/components/motion/markPaths";
import ThemeToggle from "@/components/ThemeToggle";
import { LOGIN_ROUTE } from "@/constants";

export const metadata = {
  title: "viteCV · Build your resume and find the right role",
};

const FEATURES = [
  {
    icon: PencilIcon,
    title: "Resume Builder",
    body: "Build section by section, or upload a PDF or DOCX and edit what we pull out. Typeset by Typst, so the PDF matches the preview.",
  },
  {
    icon: FileTextIcon,
    title: "Cover Letter",
    body: "The same editor, templates and Typst output, for the letter that goes with each application.",
  },
  {
    icon: SparkleIcon,
    title: "Job Match",
    body: "Paste a posting to see what it asks for and how much of it your resume already proves.",
  },
  {
    icon: LayoutGridIcon,
    title: "Insights",
    body: "Spot keyword gaps and role signals across the jobs you are targeting.",
  },
  {
    icon: BriefcaseIcon,
    title: "Job Tracker",
    body: "Move every application from Saved to Offer on one board.",
  },
  {
    icon: UploadIcon,
    title: "Library",
    body: "Keep every bullet, project and skill in one place, and pull them into any resume.",
  },
];

const TRUST = ["Free to start", "Private by default", "Built on your resume"];

const SECTION_TITLE =
  "font-serif text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50";

/**
 * The public landing page. Everything here is static; "Get started" goes to
 * /login, which forwards a signed-in visitor straight to the dashboard.
 */
export default function Landing() {
  return (
    <div className="min-h-full bg-background text-zinc-900 dark:text-zinc-50">
      <nav aria-label="Main" className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <Link href="/" aria-label="viteCV home" className="flex rounded-md">
            <Logo height={30} />
          </Link>
          <div className="flex flex-wrap items-center gap-1">
            <a
              href="#features"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 hover:text-accent dark:text-zinc-400"
            >
              Features
            </a>
            <a
              href="#extension"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 hover:text-accent dark:text-zinc-400"
            >
              Extension
            </a>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link href={LOGIN_ROUTE} className={buttonClasses("primary", "lg", "ml-2")}>
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(var(--accent-border)_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-45"
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-24">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-accent-alt">
              <path d={SPARKLE_24} />
            </svg>
            viteCV · AI career agent
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl font-serif text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Build your resume and find{" "}
            <span className="text-accent">the right role.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Write a resume and cover letter, check your fit against a posting,
            and keep every application moving, with one assistant.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={LOGIN_ROUTE} className={buttonClasses("primary", "lg", "px-5 py-3 text-[15px]")}>
              Upload my resume
            </Link>
            <a href="#features" className={buttonClasses("secondary", "lg", "bg-background px-5 py-3 text-[15px]")}>
              See how it works
            </a>
          </div>
          <p className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {TRUST.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </p>

          <div className="mx-auto mt-14 max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- animated SVG must stay an <img> to keep its CSS animation */}
            <img
              src="/brand/hero-light.svg"
              alt="A resume card beside an 82% job match: the ring fills while skills land as evidenced or gap"
              width={1200}
              height={560}
              className="h-auto w-full dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- animated SVG must stay an <img> to keep its CSS animation */}
            <img
              src="/brand/hero-dark.svg"
              alt="A resume card beside an 82% job match: the ring fills while skills land as evidenced or gap"
              width={1200}
              height={560}
              className="hidden h-auto w-full dark:block"
            />
          </div>
        </div>
      </header>

      <section
        id="features"
        className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Everything in one place
          </p>
          <h2 className={`mt-2.5 ${SECTION_TITLE}`}>From first draft to offer.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="flex flex-col gap-2.5 rounded-xl border border-zinc-200 bg-background p-6 dark:border-zinc-800"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent-subtle text-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="extension" className="bg-accent text-white dark:text-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-6 py-16">
          <div className="min-w-0 flex-[1_1_420px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
            <img src="/brand/mark-on-blue.svg" alt="" width={56} height={56} />
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Save any job. See your match.
            </h2>
            <p className="mt-3.5 max-w-lg text-[17px] leading-relaxed text-accent-subtle-hover dark:text-zinc-950/80">
              The viteCV Job Saver opens a side panel on LinkedIn, Indeed and
              other career sites. Pair it once with a one-time code.
            </p>
          </div>
          <Link
            href={LOGIN_ROUTE}
            className="rounded-md bg-white px-5 py-3 text-[15px] font-semibold text-accent transition-colors hover:bg-accent-subtle dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Connect the extension
          </Link>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
          <img src="/brand/mark.svg" alt="" width={72} height={72} className="mx-auto" />
          <h2 className={`mt-6 ${SECTION_TITLE} sm:text-5xl`}>
            Your next application, <span className="text-accent">tailored.</span>
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Sign in with Google and upload the resume you already have.
          </p>
          <Link
            href={LOGIN_ROUTE}
            className={buttonClasses("primary", "lg", "mt-7 px-5 py-3 text-[15px]")}
          >
            Get started free
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-7 text-sm text-zinc-600 dark:text-zinc-400">
          <Logo height={22} />
          <span>Built with Next.js, Firebase and Typst.</span>
        </div>
      </footer>
    </div>
  );
}
