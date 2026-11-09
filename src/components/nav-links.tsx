"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/chores", label: "Chores" },
  { href: "/shopping", label: "Shopping" },
  { href: "/activities", label: "Kids" },
  { href: "/rewards", label: "Rewards" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex w-full max-w-3xl overflow-x-auto px-2 sm:gap-1 sm:px-4 [scrollbar-width:none]">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap border-b-2 px-2 py-2 sm:px-3 text-sm font-medium ${active ? "border-honey text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
