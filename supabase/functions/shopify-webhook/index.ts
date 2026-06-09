import { getServiceClient } from "../_shared/auth.ts";
import { decryptShopifyToken } from "../_shared/shopify-crypto.ts";
import {
  handleInventoryUpdate,
  handleShopifyProductDelete,
  handleShopifyProductWebhook,
} from "../_shared/shopify-sync.ts";
import { verifyWebhookHmacAsync, type ShopifyProduct } from "../_shared/shopify.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const hmac = req.headers.get("X-Shopify-Hmac-Sha256");
  const topic = req.headers.get("X-Shopify-Topic");
  const shopDomain = req.headers.get("X-Shopify-Shop-Domain");

  if (!topic || !shopDomain) {
    return new Response("Missing webhook headers", { status: 400 });
  }

  const valid = await verifyWebhookHmacAsync(rawBody, hmac);
  if (!valid) {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  const supabase = getServiceClient();

  const { data: store, error } = await supabase
    .from("dealer_shopify_stores")
    .select("*")
    .eq("shop_domain", shopDomain)
    .eq("integration_enabled", true)
    .maybeSingle();

  if (error || !store) {
    return new Response("Store not found", { status: 404 });
  }

  const accessToken = await decryptShopifyToken(store.access_token_encrypted);
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const logBase = {
    dealer_id: store.dealer_id,
    store_id: store.id,
    sync_type: "webhook" as const,
  };

  try {
    switch (topic) {
      case "products/create":
      case "products/update": {
        const product = payload as unknown as ShopifyProduct;
        await handleShopifyProductWebhook({
          supabase,
          storeId: store.id,
          shopDomain,
          accessToken,
          dealerId: store.dealer_id,
          sellerUserId: store.user_id,
          product,
        });
        await supabase.from("shopify_sync_logs").insert({
          ...logBase,
          status: "success",
          products_updated: 1,
          metadata: { topic, product_id: product.id },
        });
        break;
      }
      case "products/delete": {
        const productId = String((payload as { id?: number }).id ?? "");
        await handleShopifyProductDelete({
          supabase,
          sellerUserId: store.user_id,
          shopifyProductId: productId,
        });
        await supabase.from("shopify_sync_logs").insert({
          ...logBase,
          status: "success",
          products_deleted: 1,
          metadata: { topic, product_id: productId },
        });
        break;
      }
      case "inventory_levels/update": {
        const inv = payload as {
          inventory_item_id?: number;
          available?: number;
        };
        if (inv.inventory_item_id != null && inv.available != null) {
          await handleInventoryUpdate({
            supabase,
            storeId: store.id,
            sellerUserId: store.user_id,
            inventoryItemId: inv.inventory_item_id,
            available: inv.available,
            shopDomain,
            accessToken,
          });
          await supabase.from("shopify_sync_logs").insert({
            ...logBase,
            status: "success",
            products_updated: 1,
            metadata: { topic, inventory_item_id: inv.inventory_item_id, available: inv.available },
          });
        }
        break;
      }
      default:
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    await supabase.from("shopify_sync_logs").insert({
      ...logBase,
      status: "failed",
      error_message: message,
      metadata: { topic },
    });
    return new Response(message, { status: 500 });
  }
});
