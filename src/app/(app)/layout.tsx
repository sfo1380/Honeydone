import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/card";
import { NavLinks } from "@/components/nav-links";
import { requireHousehold } from "@/lib/dal";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" aria-label="Honeydone dashboard">
            <Logo />
          </Link>
          <Suspense fallback={<div className="h-8" />}>
            <UserMenu />
          </Suspense>
        </div>
        <NavLinks />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Suspense fallback={<p className="text-muted">Loading…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}

async function UserMenu() {
  const { user, household } = await requireHousehold();
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">{household.name}</span>
      <span
        aria-label={`Signed in as ${user.displayName}`}
        className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: user.color }}
      >
        {user.displayName.slice(0, 1).toUpperCase()}
      </span>
      <form action={signOut}>
        <button type="submit" className="rounded-lg px-2 py-1 text-muted hover:text-foreground">
          Sign out
        </button>
      </form>
    </div>
  );
}
