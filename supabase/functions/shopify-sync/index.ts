import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { decryptShopifyToken } from "../_shared/shopify-crypto.ts";
import { syncShopifyProducts } from "../_shared/shopify-sync.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const supabase = getServiceClient();
    const body = await req.json().catch(() => ({}));
    const adminStoreId = body.storeId as string | undefined;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";
    const isServiceCall =
      adminStoreId &&
      serviceKey &&
      authHeader.replace("Bearer ", "") === serviceKey;

    let storeQuery = supabase.from("dealer_shopify_stores").select("*");

    if (isServiceCall) {
      storeQuery = storeQuery.eq("id", adminStoreId);
    } else {
      const authResult = await getAuthenticatedUser(req);
      if (authResult instanceof Response) return authResult;
      storeQuery = storeQuery.eq("user_id", authResult.user.id);
    }

    const { data: store, error } = await storeQuery.eq("integration_enabled", true).maybeSingle();

    if (error || !store) {
      return jsonResponse({ message: "No Shopify store connected" }, 404);
    }

    const accessToken = await decryptShopifyToken(store.access_token_encrypted);
    const result = await syncShopifyProducts({
      supabase,
      storeId: store.id,
      shopDomain: store.shop_domain,
      accessToken,
      dealerId: store.dealer_id,
      sellerUserId: store.user_id,
      syncType: isServiceCall ? "admin_force" : "manual",
    });

    return jsonResponse({
      success: true,
      created: result.created,
      updated: result.updated,
      deleted: result.deleted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return jsonResponse({ message }, 500);
  }
});
