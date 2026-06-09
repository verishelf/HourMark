import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { buildOAuthUrl, normalizeShopDomain } from "../_shared/shopify.ts";

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
    const { shopDomain: rawDomain } = await req.json();
    if (!rawDomain) {
      return jsonResponse({ message: "Shop domain is required" }, 400);
    }

    const shopDomain = normalizeShopDomain(rawDomain);
    const supabase = getServiceClient();
    const stateToken = crypto.randomUUID();

    await supabase.from("shopify_oauth_states").insert({
      user_id: user.id,
      shop_domain: shopDomain,
      state_token: stateToken,
    });

    const url = buildOAuthUrl(shopDomain, stateToken);
    return jsonResponse({ url, shopDomain });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ message }, 500);
  }
});
