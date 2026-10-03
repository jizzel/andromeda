import type { AgreementActivity } from "@/types/agreement";

interface EventLike {
  at: string;
  event: string;
  detail: Record<string, unknown>;
}

const str = (value: unknown) => (typeof value === "string" ? value : "");

/**
 * Folds a proposal's events (sheet order) into the activity of the agreement
 * with `agreementHash`. Only events recorded against that hash count: after a
 * void and re-sign, the earlier agreement's sends and requests are history.
 */
export function foldAgreementActivity(events: EventLike[], agreementHash: string): AgreementActivity {
  const activity: AgreementActivity = { sends: [], changeRequests: [], executedEmails: [], onboarding: null };
  for (const e of events) {
    if (str(e.detail.agreementHash) !== agreementHash) continue;
    switch (e.event) {
      case "agreement_sent":
        activity.sends.push({ sentAt: str(e.detail.sentAt) || e.at, to: str(e.detail.to), email: "pending" });
        break;
      case "agreement_send_email": {
        const sentAt = str(e.detail.sentAt);
        let send = activity.sends.find((s) => s.sentAt === sentAt);
        // The send's own event may be missing (it's best-effort after the commit): the email outcome still shows it.
        if (!send) activity.sends.push((send = { sentAt: sentAt || e.at, to: str(e.detail.to), email: "pending" }));
        send.email = e.detail.status === "sent" ? "sent" : "failed";
        if (e.detail.status === "sent") delete send.error;
        else if (e.detail.error) send.error = str(e.detail.error);
        break;
      }
      case "agreement_changes_requested":
        activity.changeRequests.push({ at: e.at, note: str(e.detail.note) });
        break;
      case "agreement_executed_email": {
        const recipient = e.detail.recipient === "provider" ? "provider" : "client";
        activity.executedEmails = activity.executedEmails.filter((m) => m.recipient !== recipient);
        activity.executedEmails.push({
          recipient,
          status: e.detail.status === "sent" ? "sent" : "failed",
          attached: e.detail.attached === true,
          at: e.at,
          ...(e.detail.error ? { error: str(e.detail.error) } : {}),
        });
        break;
      }
      case "agreement_onboarding_unlocked":
        // The first complete outcome stands (a later concurrent run reports "already");
        // a recorded failure is replaced by a later attempt.
        if (activity.onboarding && !onboardingFailed(activity.onboarding)) break;
        activity.onboarding = {
          assets: (str(e.detail.assets) || "failed") as NonNullable<AgreementActivity["onboarding"]>["assets"],
          tracker: (str(e.detail.tracker) || "failed") as NonNullable<AgreementActivity["onboarding"]>["tracker"],
          at: e.at,
        };
        break;
    }
  }
  return activity;
}

export const onboardingFailed = (onboarding: NonNullable<AgreementActivity["onboarding"]>) =>
  onboarding.assets === "failed" || onboarding.tracker === "failed";

/** Whether an executed agreement's follow-up is still owed: onboarding not (successfully) recorded, or a copy not sent. */
export function followUpIncomplete(activity: AgreementActivity): boolean {
  const sentTo = new Set(activity.executedEmails.filter((m) => m.status === "sent").map((m) => m.recipient));
  return !activity.onboarding || onboardingFailed(activity.onboarding) || !sentTo.has("client") || !sentTo.has("provider");
}
