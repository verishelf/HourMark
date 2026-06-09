import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { decryptShopifyToken } from "../_shared/shopify-crypto.ts";
import { deleteWebhooks } from "../_shared/shopify.ts";

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
    const supabase = getServiceClient();

    const { data: store, error } = await supabase
      .from("dealer_shopify_stores")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !store) {
      return jsonResponse({ message: "No Shopify store connected" }, 404);
    }

    try {
      const accessToken = await decryptShopifyToken(store.access_token_encrypted);
      const webhookIds = (store.webhook_ids as number[]) ?? [];
      if (webhookIds.length) {
        await deleteWebhooks(store.shop_domain, accessToken, webhookIds);
      }
    } catch (webhookErr) {
      console.warn("Webhook cleanup failed:", webhookErr);
    }

    await supabase.from("shopify_sync_logs").insert({
      dealer_id: store.dealer_id,
      store_id: store.id,
      sync_type: "manual",
      status: "success",
      metadata: { action: "disconnect", user_id: user.id },
    });

    await supabase.from("dealer_shopify_stores").delete().eq("id", store.id);

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Disconnect failed";
    return jsonResponse({ message }, 500);
  }
});
