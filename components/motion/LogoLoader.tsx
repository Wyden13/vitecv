import AnimatedMark from "./AnimatedMark";

export interface LogoLoaderProps {
  label?: string;
}

/** Full-area wait: the looping mark with a caption under it. */
export default function LogoLoader({ label = "Loading…" }: LogoLoaderProps) {
  return (
    <div
      role="status"
      className="flex flex-1 flex-col items-center justify-center gap-4 py-24"
    >
      <AnimatedMark mode="loader" className="size-16" label="" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </p>
    </div>
  );
}
