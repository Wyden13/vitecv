"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./Sidebar";

interface SidebarItemProps {
  item: NavItem;
}

export default function SidebarItem({ item }: SidebarItemProps) {
  const pathname = usePathname();
  const { label, href } = item;

  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`rounded-md px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      }`}
    >
      {label}
    </Link>
  );
}
