import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { safeNext } from "@/lib/safe-next";
import { SignInForm } from "./signin-form";

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { next } = await searchParams;
  const nextPath = safeNext(next);
  const user = await getCurrentUser();
  if (user) redirect(nextPath ?? "/dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <SignInForm next={nextPath} />
      <p className="text-sm text-muted">
        New to Honeydone?{" "}
        <Link className="font-semibold text-foreground underline" href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
