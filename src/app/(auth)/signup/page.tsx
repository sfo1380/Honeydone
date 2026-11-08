import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { safeNext } from "@/lib/safe-next";
import { SignUpForm } from "./signup-form";

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  const nextPath = safeNext(next);
  const user = await getCurrentUser();
  if (user) redirect(nextPath ?? "/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted">
          {nextPath ? "Then you'll join your partner's household." : "You'll invite your partner next."}
        </p>
      </div>
      <SignUpForm next={nextPath} />
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-foreground underline" href={nextPath ? `/signin?next=${encodeURIComponent(nextPath)}` : "/signin"}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
