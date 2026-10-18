"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "./Sidebar";

const BASE = "rounded-md px-3 py-2 text-sm transition-colors";

const INACTIVE =
  "text-zinc-600 hover:bg-accent-subtle hover:text-accent dark:text-zinc-400";

const ACTIVE = "bg-accent-subtle-hover font-medium text-accent";

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
