"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/chores", label: "Chores" },
  { href: "/shopping", label: "Shopping" },
  { href: "/settings", label: "Settings" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex w-full max-w-3xl gap-1 px-4">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-honey text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
