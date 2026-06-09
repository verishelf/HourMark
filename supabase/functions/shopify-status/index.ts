import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "GET") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const { user } = authResult;
    const supabase = getServiceClient();

    const { data: store } = await supabase
      .from("dealer_shopify_stores_public")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!store) {
      return jsonResponse({ connected: false });
    }

    const { data: recentLogs } = await supabase
      .from("shopify_sync_logs")
      .select("id, sync_type, status, products_created, products_updated, error_message, created_at")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(5);

    return jsonResponse({
      connected: true,
      store: {
        id: store.id,
        shopName: store.shop_name,
        shopDomain: store.shop_domain,
        shopUrl: `https://${store.shop_domain}`,
        connectedAt: store.connected_at,
        lastSync: store.last_sync,
        productsImported: store.products_imported,
        syncStatus: store.sync_status,
        sellerFeeRate: store.seller_fee_rate,
        integrationEnabled: store.integration_enabled,
      },
      recentLogs: recentLogs ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ message }, 500);
  }
});
