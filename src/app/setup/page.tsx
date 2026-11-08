import { redirect } from "next/navigation";
import { Card, Logo } from "@/components/card";
import { requireUser } from "@/lib/dal";
import { HouseholdForm } from "@/components/household-form";

export default async function SetupPage() {
  const user = await requireUser();
  if (user.householdId) redirect("/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <Logo />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Hi {user.displayName}, let&apos;s set up your household</h1>
        <p className="text-muted">You&apos;ll get a link to invite your partner on the next screen.</p>
      </div>
      <Card>
        <HouseholdForm mode="create" />
      </Card>
      <p className="text-sm text-muted">
        Did your partner already set things up? Open the invite link they sent you, and you&apos;ll join their household.
      </p>
    </main>
  );
}
