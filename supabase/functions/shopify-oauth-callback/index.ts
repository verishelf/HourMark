import { getServiceClient } from "../_shared/auth.ts";
import { getSellerFeeRate } from "../_shared/fees.ts";
import { encryptShopifyToken } from "../_shared/shopify-crypto.ts";
import { syncShopifyProducts } from "../_shared/shopify-sync.ts";
import {
  exchangeOAuthCode,
  registerWebhooks,
  shopifyAdminFetch,
} from "../_shared/shopify.ts";

const APP_SCHEME = "crownly";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const shop = url.searchParams.get("shop");

  if (!code || !state || !shop) {
    return htmlResponse("Missing OAuth parameters", false);
  }

  const supabase = getServiceClient();

  try {
    const { data: oauthState, error: stateError } = await supabase
      .from("shopify_oauth_states")
      .select("*")
      .eq("state_token", state)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (stateError || !oauthState) {
      return htmlResponse("Invalid or expired OAuth state", false);
    }

    if (oauthState.shop_domain !== shop) {
      return htmlResponse("Shop domain mismatch", false);
    }

    const tokenResponse = await exchangeOAuthCode(shop, code);
    const encryptedToken = await encryptShopifyToken(tokenResponse.access_token);

    const { data: dealerId, error: dealerError } = await supabase.rpc(
      "ensure_dealer_for_user",
      { p_user_id: oauthState.user_id }
    );
    if (dealerError || !dealerId) {
      throw new Error(dealerError?.message ?? "Could not resolve dealer record");
    }

    const shopInfo = await shopifyAdminFetch<{ shop: { name: string } }>(
      shop,
      tokenResponse.access_token,
      "/shop.json"
    );

    const sellerFeeRate = await getSellerFeeRate(supabase, oauthState.user_id);
    const { data: store, error: storeError } = await supabase
      .from("dealer_shopify_stores")
      .upsert(
        {
          dealer_id: dealerId,
          user_id: oauthState.user_id,
          shop_domain: shop,
          shop_name: shopInfo.shop?.name ?? shop,
          access_token_encrypted: encryptedToken,
          scopes: tokenResponse.scope,
          connected_at: new Date().toISOString(),
          sync_status: "syncing",
          integration_enabled: true,
          seller_fee_rate: sellerFeeRate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "dealer_id" }
      )
      .select("id")
      .single();

    if (storeError || !store) {
      throw new Error(storeError?.message ?? "Failed to save Shopify connection");
    }

    const webhookIds = await registerWebhooks(shop, tokenResponse.access_token);
    await supabase
      .from("dealer_shopify_stores")
      .update({ webhook_ids: webhookIds })
      .eq("id", store.id);

    await supabase.from("shopify_oauth_states").delete().eq("id", oauthState.id);

    syncShopifyProducts({
      supabase,
      storeId: store.id,
      shopDomain: shop,
      accessToken: tokenResponse.access_token,
      dealerId,
      sellerUserId: oauthState.user_id,
      syncType: "initial_import",
    }).catch((err) => console.error("Initial Shopify sync failed:", err));

    return htmlResponse("Shopify connected successfully", true);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    console.error("Shopify OAuth callback error:", message);
    return htmlResponse(message, false);
  }
});

function htmlResponse(message: string, success: boolean) {
  const deepLink = `${APP_SCHEME}:///profile/shopify?connected=${success ? "1" : "0"}`;
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${deepLink}" />
    <title>Shopify ${success ? "Connected" : "Error"}</title>
    <style>
      body { font-family: -apple-system, sans-serif; background: #000; color: #fff;
        display: grid; place-items: center; min-height: 100vh; text-align: center; padding: 24px; }
      a { color: #c9a962; }
    </style>
  </head>
  <body>
    <div>
      <h1>${success ? "Shopify Connected" : "Connection Failed"}</h1>
      <p>${message}</p>
      <p><a href="${deepLink}">Return to Crownly</a></p>
    </div>
  </body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
