import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { getStripeClient } from "../_shared/stripe.ts";
import {
  mapAccountToUiStatus,
  syncVerificationFromAccount,
} from "../_shared/verification.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const { user } = authResult;
    const supabase = getServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("stripe_account_id, stripe_onboarding_status, verified")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return jsonResponse({ message: profileError.message }, 500);
    }

    if (!profile?.stripe_account_id) {
      return jsonResponse({
        status: "not_started",
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsDue: [],
        rejectionReason: null,
      });
    }

    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const result = await syncVerificationFromAccount(supabase, user.id, account);

    return jsonResponse({
      ...result,
      status: mapAccountToUiStatus(account, profile.stripe_onboarding_status),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ message }, 500);
  }
});
