import type Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type DbVerificationStatus = "pending" | "approved" | "rejected";

export type UiVerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "action_required";

export function getRequirementsDue(account: Stripe.Account): string[] {
  return [
    ...(account.requirements?.currently_due ?? []),
    ...(account.requirements?.past_due ?? []),
  ];
}

export function mapAccountToDbStatus(account: Stripe.Account): DbVerificationStatus {
  const requirementsDue = getRequirementsDue(account);

  if (account.requirements?.disabled_reason) {
    return "rejected";
  }

  if (
    account.charges_enabled &&
    account.payouts_enabled &&
    requirementsDue.length === 0
  ) {
    return "approved";
  }

  return "pending";
}

export function mapAccountToUiStatus(
  account: Stripe.Account | null,
  onboardingStatus: string | null
): UiVerificationStatus {
  if (!account) {
    return onboardingStatus === "not_started" || !onboardingStatus
      ? "not_started"
      : "pending";
  }

  const dbStatus = mapAccountToDbStatus(account);
  if (dbStatus === "approved") return "verified";
  if (dbStatus === "rejected") return "action_required";
  if (account.details_submitted) return "pending";
  return "not_started";
}

export async function syncVerificationFromAccount(
  supabase: SupabaseClient,
  userId: string,
  account: Stripe.Account
) {
  const requirementsDue = getRequirementsDue(account);
  const dbStatus = mapAccountToDbStatus(account);
  const rejectionReason = account.requirements?.disabled_reason ?? null;

  const { error } = await supabase.rpc("sync_seller_verification", {
    p_user_id: userId,
    p_stripe_account_id: account.id,
    p_status: dbStatus,
    p_requirements_due: requirementsDue,
    p_rejection_reason: rejectionReason,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    status: mapAccountToUiStatus(account, null),
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    requirementsDue,
    rejectionReason,
  };
}
