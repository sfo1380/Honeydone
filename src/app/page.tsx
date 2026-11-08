import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/card";
import { getCurrentUser } from "@/lib/session";

/** Signed-in visitors skip the landing page. */
async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect(user.householdId ? "/dashboard" : "/setup");
  return null;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <Logo />
      <div className="space-y-3">
        <h1 className="text-3xl font-bold leading-tight">Run your home together.</h1>
        <p className="text-lg text-muted">
          Chores, shopping, the kids&apos; activities and your budget, shared between the two of you.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/signup" className="rounded-lg bg-honey px-4 py-2.5 text-center font-semibold text-honey-ink">
          Create an account
        </Link>
        <Link href="/signin" className="rounded-lg border border-line px-4 py-2.5 text-center font-semibold">
          Sign in
        </Link>
      </div>
    </main>
  );
}
