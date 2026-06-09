import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getSellerFeeRate } from "./fees.ts";
import {
  parseWatchFromProduct,
  shopifyAdminFetch,
  type ShopifyProduct,
} from "./shopify.ts";

type SyncResult = {
  created: number;
  updated: number;
  deleted: number;
};

export async function syncShopifyProducts(params: {
  supabase: SupabaseClient;
  storeId: string;
  shopDomain: string;
  accessToken: string;
  dealerId: string;
  sellerUserId: string;
  syncType: "initial_import" | "manual" | "webhook" | "scheduled" | "admin_force";
}): Promise<SyncResult> {
  const { supabase, storeId, shopDomain, accessToken, dealerId, sellerUserId, syncType } = params;

  await supabase
    .from("dealer_shopify_stores")
    .update({ sync_status: "syncing", updated_at: new Date().toISOString() })
    .eq("id", storeId);

  const { data: logRow } = await supabase
    .from("shopify_sync_logs")
    .insert({
      dealer_id: dealerId,
      store_id: storeId,
      sync_type: syncType,
      status: "started",
    })
    .select("id")
    .single();

  const logId = logRow?.id;
  const result: SyncResult = { created: 0, updated: 0, deleted: 0 };

  try {
    const sellerFeeRate = await getSellerFeeRate(supabase, sellerUserId);
    let pageInfo: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const path = pageInfo
        ? `/products.json?limit=50&page_info=${pageInfo}`
        : "/products.json?limit=50&status=active";
      const response = await shopifyAdminFetch<{
        products: ShopifyProduct[];
      }>(shopDomain, accessToken, path);

      for (const product of response.products ?? []) {
        const upserted = await upsertShopifyListing({
          supabase,
          product,
          sellerUserId,
          sellerFeeRate,
        });
        if (upserted === "created") result.created++;
        else if (upserted === "updated") result.updated++;
      }

      hasMore = (response.products?.length ?? 0) === 50;
      pageInfo = null;
      if (hasMore) break;
    }

    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerUserId)
      .eq("external_source", "shopify");

    await supabase
      .from("dealer_shopify_stores")
      .update({
        sync_status: "success",
        last_sync: new Date().toISOString(),
        products_imported: count ?? 0,
        seller_fee_rate: sellerFeeRate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (dealerId) {
      await supabase.from("dealer_activities").insert({
        dealer_id: dealerId,
        activity_type: "inventory_imported",
        notes: `Shopify sync: ${result.created} created, ${result.updated} updated`,
        created_by: sellerUserId,
      });

      await supabase
        .from("dealers")
        .update({
          pipeline_status: "inventory_imported",
          updated_at: new Date().toISOString(),
        })
        .eq("id", dealerId)
        .in("pipeline_status", ["account_created", "demo_scheduled", "proposal_sent"]);
    }

    if (logId) {
      await supabase
        .from("shopify_sync_logs")
        .update({
          status: "success",
          products_created: result.created,
          products_updated: result.updated,
          products_deleted: result.deleted,
        })
        .eq("id", logId);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await supabase
      .from("dealer_shopify_stores")
      .update({ sync_status: "error", updated_at: new Date().toISOString() })
      .eq("id", storeId);

    if (logId) {
      await supabase
        .from("shopify_sync_logs")
        .update({ status: "failed", error_message: message })
        .eq("id", logId);
    }
    throw error;
  }
}

async function upsertShopifyListing(params: {
  supabase: SupabaseClient;
  product: ShopifyProduct;
  sellerUserId: string;
  sellerFeeRate: number;
}): Promise<"created" | "updated" | "skipped"> {
  const { supabase, product, sellerUserId, sellerFeeRate } = params;
  const variant = product.variants[0];
  if (!variant) return "skipped";

  const parsed = parseWatchFromProduct(product);
  const priceCents = Math.round(parseFloat(variant.price) * 100);
  const inventoryQty = variant.inventory_quantity ?? 0;
  const images = product.images.map((img) => img.src);
  const shopifyProductId = String(product.id);
  const shopifyVariantId = String(variant.id);

  const status = inventoryQty <= 0 ? "sold" : "active";
  const authStatus = inventoryQty <= 0 ? "auto_verified" : "auto_verified";

  const { data: existing } = await supabase
    .from("listings")
    .select("id")
    .eq("seller_id", sellerUserId)
    .eq("shopify_product_id", shopifyProductId)
    .maybeSingle();

  const payload = {
    brand: parsed.brand,
    model: parsed.model,
    reference_number: parsed.referenceNumber,
    year: parsed.year,
    condition: parsed.condition,
    price: priceCents,
    description: stripHtml(product.body_html),
    images,
    status,
    authentication_status: authStatus,
    authenticated: true,
    ai_trust_score: 85,
    trust_badges: ["escrow_protected", "shopify_synced"],
    external_source: "shopify",
    shopify_product_id: shopifyProductId,
    shopify_variant_id: shopifyVariantId,
    shopify_sku: variant.sku,
    inventory_quantity: inventoryQty,
    import_seller_fee_rate: sellerFeeRate,
  };

  if (existing?.id) {
    await supabase.from("listings").update(payload).eq("id", existing.id);
    return "updated";
  }

  await supabase.from("listings").insert({
    seller_id: sellerUserId,
    ...payload,
    fraud_flags: [],
  });
  return "created";
}

export async function handleShopifyProductWebhook(params: {
  supabase: SupabaseClient;
  storeId: string;
  shopDomain: string;
  accessToken: string;
  dealerId: string;
  sellerUserId: string;
  product: ShopifyProduct;
}): Promise<void> {
  const sellerFeeRate = await getSellerFeeRate(params.supabase, params.sellerUserId);
  await upsertShopifyListing({
    supabase: params.supabase,
    product: params.product,
    sellerUserId: params.sellerUserId,
    sellerFeeRate,
  });

  await params.supabase
    .from("dealer_shopify_stores")
    .update({
      last_sync: new Date().toISOString(),
      sync_status: "success",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.storeId);
}

export async function handleShopifyProductDelete(params: {
  supabase: SupabaseClient;
  sellerUserId: string;
  shopifyProductId: string;
}): Promise<void> {
  await params.supabase
    .from("listings")
    .update({ status: "archived" })
    .eq("seller_id", params.sellerUserId)
    .eq("shopify_product_id", params.shopifyProductId);
}

export async function handleInventoryUpdate(params: {
  supabase: SupabaseClient;
  storeId: string;
  sellerUserId: string;
  inventoryItemId: number;
  available: number;
  shopDomain: string;
  accessToken: string;
}): Promise<void> {
  const { supabase, sellerUserId, inventoryItemId, available } = params;

  const { data: listing } = await supabase
    .from("listings")
    .select("id, shopify_variant_id")
    .eq("seller_id", sellerUserId)
    .eq("external_source", "shopify")
    .not("shopify_variant_id", "is", null);

  const listings = listing ?? [];
  for (const row of listings) {
    const variantResponse = await shopifyAdminFetch<{ variant: { inventory_item_id: number } }>(
      params.shopDomain,
      params.accessToken,
      `/variants/${row.shopify_variant_id}.json`
    ).catch(() => null);

    if (variantResponse?.variant?.inventory_item_id !== inventoryItemId) continue;

    const status = available <= 0 ? "sold" : "active";
    await supabase
      .from("listings")
      .update({
        inventory_quantity: available,
        status,
      })
      .eq("id", row.id);
    break;
  }

  await supabase
    .from("dealer_shopify_stores")
    .update({
      last_sync: new Date().toISOString(),
      sync_status: "success",
    })
    .eq("id", params.storeId);
}

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
