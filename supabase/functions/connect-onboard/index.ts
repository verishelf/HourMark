import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { getStripeClient } from "../_shared/stripe.ts";
import { syncVerificationFromAccount } from "../_shared/verification.ts";

function buildStripeReturnUrl(returnPath?: string, returnUrl?: string): string {
  if (returnUrl) {
    try {
      const parsed = new URL(returnUrl);
      if (parsed.protocol === "https:") {
        return parsed.toString();
      }
    } catch {
      // Fall through to the hosted return page.
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
  const path = returnPath === "sell" ? "sell" : "profile";
  return `${supabaseUrl}/functions/v1/connect-return?path=${path}`;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const { user } = authResult;
    const { returnPath, returnUrl } = await req.json();
    const stripeReturnUrl = buildStripeReturnUrl(returnPath, returnUrl);

    const supabase = getServiceClient();
    const stripe = getStripeClient();

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return jsonResponse({ message: profileError.message }, 500);
    }

    let accountId = profile?.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { user_id: user.id },
      });
      accountId = account.id;

      await syncVerificationFromAccount(supabase, user.id, account);
    }

    const account = await stripe.accounts.retrieve(accountId);
    const linkType =
      account.details_submitted && !account.charges_enabled
        ? "account_update"
        : "account_onboarding";

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: stripeReturnUrl,
      return_url: stripeReturnUrl,
      type: linkType,
    });

    await syncVerificationFromAccount(supabase, user.id, account);

    return jsonResponse({ url: accountLink.url, accountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ message }, 500);
  }
});
