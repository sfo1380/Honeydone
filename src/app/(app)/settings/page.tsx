import { Card } from "@/components/card";
import { HouseholdForm } from "@/components/household-form";
import { InvitePanel } from "@/components/invite-panel";
import { KidsEditor } from "@/components/kids-editor";
import { ProfileForm } from "@/components/profile-form";
import { requireHousehold } from "@/lib/dal";
import { inviteUrl } from "@/lib/invite-url";

export default async function SettingsPage() {
  const { user, household, partner } = await requireHousehold();
  const url = household.inviteCode ? await inviteUrl(household.inviteCode) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card title="Your profile">
        <ProfileForm displayName={user.displayName} color={user.color} />
      </Card>
      <Card title="Partner">
        {partner ? (
          <p>
            <span className="font-semibold" style={{ color: partner.color }}>{partner.displayName}</span>{" "}
            <span className="text-muted">({partner.email})</span> shares this household with you.
          </p>
        ) : url ? (
          <InvitePanel url={url} />
        ) : null}
      </Card>
      <Card title="Household">
        <HouseholdForm mode="update" defaults={{ name: household.name, timeZone: household.timeZone }} />
      </Card>
      <Card title="Kids">
        <KidsEditor kids={household.kids.map((k) => ({ id: k.id, name: k.name }))} />
      </Card>
    </div>
  );
}
