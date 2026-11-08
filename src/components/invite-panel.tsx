import { regenerateInviteAction } from "@/app/actions/household";
import { CopyButton } from "./copy-button";

export function InvitePanel({ url }: { url: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Send this link to your partner. Once they join, the link stops working because a household is just the two of
        you.
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          aria-label="Invite link"
          className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2 text-sm"
        />
        <CopyButton text={url} />
      </div>
      <form action={regenerateInviteAction}>
        <button type="submit" className="text-sm text-muted underline hover:text-foreground">
          Make a new link (the old one stops working)
        </button>
      </form>
    </div>
  );
}
