import { SparkleIcon } from "../icons";
import PromptComposer from "./PromptComposer";

const TRUST = ["Free to start", "Private by default", "Built on your resume"];

export default function DashboardHero() {
  return (
    <section className="px-6 pb-12 pt-20 text-center sm:pt-24">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
        <SparkleIcon className="size-4" />
        viteCV · AI career agent
      </p>

      <h1 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
        Build your resume and find{" "}
        <span className="text-accent">the right role.</span>
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        Write a resume and cover letter, check your fit against a posting, and
        keep every application moving — with one assistant.
      </p>

      <div className="mx-auto mt-9 max-w-2xl">
        <PromptComposer />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {TRUST.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}
