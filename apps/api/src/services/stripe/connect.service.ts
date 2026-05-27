import { stripe } from "../../lib/stripe.js";
import { env } from "../../config/env.js";
import { getSupabaseAdmin } from "../../lib/supabase.js";

export const connectService = {
  async getOrCreateStripeAccount(userId: string, email?: string) {
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("stripe_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { user_id: userId },
    });

    await supabase.from("sellers").upsert(
      { id: userId },
      { onConflict: "id" }
    );

    const { data: stripeAccount, error } = await supabase
      .from("stripe_accounts")
      .insert({
        user_id: userId,
        stripe_account_id: account.id,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from("users")
      .update({ stripe_account_id: account.id })
      .eq("id", userId);

    return stripeAccount;
  },

  async createOnboardingLink(userId: string, returnUrl?: string) {
    const supabase = getSupabaseAdmin();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      throw new Error("User not found");
    }

    const stripeAccount = await this.getOrCreateStripeAccount(userId);
    const refreshUrl = returnUrl ?? env.stripeConnectRefreshUrl;
    const redirectUrl = returnUrl ?? env.stripeConnectReturnUrl;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.stripe_account_id,
      refresh_url: refreshUrl,
      return_url: redirectUrl,
      type: "account_onboarding",
    });

    return {
      url: accountLink.url,
      accountId: stripeAccount.stripe_account_id,
      expiresAt: accountLink.expires_at,
    };
  },

  async getConnectStatus(userId: string) {
    const supabase = getSupabaseAdmin();

    const { data: stripeAccount } = await supabase
      .from("stripe_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!stripeAccount) {
      return {
        hasAccount: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }

    const account = await stripe.accounts.retrieve(
      stripeAccount.stripe_account_id
    );

    const onboardingComplete = Boolean(
      account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled
    );

    await supabase
      .from("stripe_accounts")
      .update({
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        details_submitted: account.details_submitted ?? false,
        onboarding_complete: onboardingComplete,
      })
      .eq("user_id", userId);

    await supabase
      .from("sellers")
      .update({
        onboarding_complete: onboardingComplete,
        payouts_enabled: account.payouts_enabled ?? false,
      })
      .eq("id", userId);

    return {
      hasAccount: true,
      accountId: stripeAccount.stripe_account_id,
      onboardingComplete,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
    };
  },

  async syncAccountFromStripe(stripeAccountId: string) {
    const supabase = getSupabaseAdmin();
    const account = await stripe.accounts.retrieve(stripeAccountId);

    const onboardingComplete = Boolean(
      account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled
    );

    const { data: row } = await supabase
      .from("stripe_accounts")
      .select("user_id")
      .eq("stripe_account_id", stripeAccountId)
      .maybeSingle();

    if (!row) return null;

    await supabase
      .from("stripe_accounts")
      .update({
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        details_submitted: account.details_submitted ?? false,
        onboarding_complete: onboardingComplete,
      })
      .eq("stripe_account_id", stripeAccountId);

    await supabase
      .from("users")
      .update({ stripe_account_id: stripeAccountId })
      .eq("id", row.user_id);

    await supabase
      .from("sellers")
      .update({
        onboarding_complete: onboardingComplete,
        payouts_enabled: account.payouts_enabled ?? false,
      })
      .eq("id", row.user_id);

    return { userId: row.user_id, onboardingComplete };
  },
};
