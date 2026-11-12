import { Suspense } from "react";
import Link from "next/link";

import Logo from "../Logo";
import SidebarItem, { SidebarItemFallback } from "./SidebarItem";

export interface NavItem {
  label: string;
  href: string;
}

const SIDEBAR_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Library", href: "/library" },
  { label: "Cover Letter", href: "/cv" },
  { label: "Resume Builder", href: "/resume" },
  { label: "Insights", href: "/insights" },
  { label: "Job Tracker", href: "/job-tracker" },
  { label: "Job Match", href: "/job-match" },
  { label: "Extension", href: "/extension" },
];

export interface SidebarProps {
  /** Prepended to every link; the screenshot demo mounts the app at /demo. */
  basePath?: string;
}

export default function Sidebar({ basePath = "" }: SidebarProps) {
  const items = basePath
    ? SIDEBAR_ITEMS.map((item) => ({ ...item, href: basePath + item.href }))
    : SIDEBAR_ITEMS;

  return (
    <nav
      aria-label="Main"
      className="flex h-full w-48 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-accent-subtle/10 p-3 print:hidden"
    >
      <Link
        href={`${basePath}/dashboard`}
        aria-label="viteCV dashboard"
        className="mb-3 self-start rounded-md px-2 py-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Logo height={26} />
      </Link>

      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <Suspense key={item.href} fallback={<SidebarItemFallback item={item} />}>
            <SidebarItem item={item} />
          </Suspense>
        ))}
      </div>
    </nav>
  );
}
