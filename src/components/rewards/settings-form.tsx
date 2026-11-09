"use client";

import { useActionState } from "react";
import { updateRewardSettingsAction } from "@/app/actions/rewards";
import { FormMessage } from "@/components/ui";

export function RewardSettingsForm({ competition, teamGoal }: { competition: boolean; teamGoal: number }) {
  const [state, action, pending] = useActionState(updateRewardSettingsAction, undefined);
  const values = state?.values;
  const goal = values?.teamGoal ?? String(teamGoal);
  const compete = values ? values.competition === "on" : competition;

  return (
    // Keyed by the saved values so React's post-action form reset shows what was saved.
    <form key={`${goal}-${compete}`} action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="team-goal" className="block text-sm font-medium">
          Weekly team goal
        </label>
        <div className="flex items-center gap-2">
          <input
            id="team-goal"
            name="teamGoal"
            type="number"
            min={10}
            max={100}
            step={1}
            defaultValue={goal}
            aria-invalid={!!state?.errors?.teamGoal}
            className="w-24 rounded-lg border border-line bg-surface px-3 py-2"
          />
          <span className="text-muted">% of chores done on time</span>
        </div>
        <p className="text-sm text-muted">Hit it together and you each win a coupon from the other.</p>
      </div>
      <label className="flex items-start gap-3">
        <input type="checkbox" name="competition" defaultChecked={compete} className="mt-1 h-4 w-4 accent-honey" />
        <span>
          <span className="block font-medium">Head-to-head: the Honey Crown</span>
          <span className="block text-sm text-muted">
            Show a weekly scoreboard. Whoever earns the most points wins a bonus coupon. Either of you can switch it off.
          </span>
        </span>
      </label>
      <FormMessage error={state?.errors?.teamGoal ?? state?.errors?.form} message={state?.message} />
      <button type="submit" disabled={pending} className="rounded-lg border border-line px-4 py-2 font-semibold disabled:opacity-60">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
