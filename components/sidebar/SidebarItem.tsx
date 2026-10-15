"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "./Sidebar";

const BASE = "rounded-md px-3 py-2 text-sm transition-colors";

const INACTIVE =
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50";

const ACTIVE =
  "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50";

/**
 * Active state depends on the URL, which is runtime data. Rendered on its own
 * this would block the static shell, so `Sidebar` suspends it and falls back
 * to `SidebarLinkFallback` — the same link, minus the highlight.
 */
export default function SidebarItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { label, href } = item;

  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`${BASE} ${isActive ? ACTIVE : INACTIVE}`}
    >
      {label}
    </Link>
  );
}

export function SidebarItemFallback({ item }: { item: NavItem }) {
  return (
    <Link href={item.href} className={`${BASE} ${INACTIVE}`}>
      {item.label}
    </Link>
  );
}
