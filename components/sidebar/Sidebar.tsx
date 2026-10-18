import { Suspense } from "react";
import Link from "next/link";

import SidebarItem, { SidebarItemFallback } from "./SidebarItem";

export interface NavItem {
  label: string;
  href: string;
}

const SIDEBAR_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Cover Letter", href: "/cv" },
  { label: "Resume Builder", href: "/resume" },
  { label: "Insights", href: "/insights" },
  { label: "Job Tracker", href: "/job-tracker" },
  { label: "Job Match", href: "/job-match" },
];

export default function Sidebar() {
  return (
    <nav
      aria-label="Main"
      className="flex h-full w-48 shrink-0 flex-col border-r border-accent-border bg-accent-subtle/50 p-3 print:hidden"
    >
      <Link
        href="/dashboard"
        className="mb-2 px-3 py-2 text-sm font-semibold tracking-tight text-accent"
      >
        viteCV
      </Link>

      <div className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map((item) => (
          <Suspense key={item.href} fallback={<SidebarItemFallback item={item} />}>
            <SidebarItem item={item} />
          </Suspense>
        ))}
      </div>
    </nav>
  );
}
