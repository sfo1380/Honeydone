import Link from "next/link";
import { Card, Logo } from "@/components/card";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { JoinButton } from "./join-button";

export default async function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const [user, household] = await Promise.all([
    getCurrentUser(),
    db.household.findUnique({
      where: { inviteCode: code },
      select: { name: true, members: { select: { displayName: true }, take: 1 } },
    }),
  ]);
  const next = encodeURIComponent(`/join/${code}`);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <Logo />
      {!household ? (
        <Card>
          <h1 className="mb-2 text-xl font-bold">This invite link doesn&apos;t work</h1>
          <p className="text-muted">
            It may have been replaced with a new one, or the household is already full. Ask your partner to send the
            current link from their Settings page.
          </p>
        </Card>
      ) : (
        <Card>
          <h1 className="mb-2 text-xl font-bold">Join {household.name}</h1>
          <p className="mb-5 text-muted">
            {household.members[0]?.displayName ?? "Your partner"} invited you to share chores, shopping, the kids&apos;
            activities and the budget.
          </p>
          {user ? (
            user.householdId ? (
              <p className="text-muted">
                You&apos;re already in a household. <Link className="underline" href="/dashboard">Go to your dashboard</Link>.
              </p>
            ) : (
              <JoinButton code={code} />
            )
          ) : (
            <div className="flex flex-col gap-3">
              <Link href={`/signup?next=${next}`} className="rounded-lg bg-honey px-4 py-2.5 text-center font-semibold text-honey-ink">
                Create an account to join
              </Link>
              <Link href={`/signin?next=${next}`} className="rounded-lg border border-line px-4 py-2.5 text-center font-semibold">
                I already have an account
              </Link>
            </div>
          )}
        </Card>
      )}
    </main>
  );
}
