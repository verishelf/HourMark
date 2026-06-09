import { supabase } from "@/lib/supabase";

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getFunctionsBaseUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  if (apiUrl) return apiUrl.replace(/\/$/, "");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
  }
  return "";
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SUPABASE_ANON_KEY) headers.apikey = SUPABASE_ANON_KEY;
  if (!token) throw new Error("You must be signed in");
  headers.Authorization = `Bearer ${token}`;
  return headers;
}

export type ShopifySyncLog = {
  id: string;
  sync_type: string;
  status: string;
  products_created: number;
  products_updated: number;
  error_message: string | null;
  created_at: string;
};

export type ShopifyStoreStatus = {
  id: string;
  shopName: string | null;
  shopDomain: string;
  shopUrl: string;
  connectedAt: string;
  lastSync: string | null;
  productsImported: number;
  syncStatus: "idle" | "syncing" | "success" | "error" | "disabled";
  sellerFeeRate: number;
  integrationEnabled: boolean;
};

export type ShopifyStatusResponse = {
  connected: boolean;
  store?: ShopifyStoreStatus;
  recentLogs?: ShopifySyncLog[];
};

export async function getShopifyStatus(): Promise<ShopifyStatusResponse> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) throw new Error("You must be signed in");

  const { data: store, error: storeError } = await supabase
    .from("dealer_shopify_stores_public")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (storeError) {
    if (storeError.code === "42P01" || storeError.message.includes("does not exist")) {
      throw new Error("Shopify integration is not set up yet. Apply the latest database migration.");
    }
    throw new Error(storeError.message);
  }

  if (!store) {
    return { connected: false };
  }

  const { data: recentLogs } = await supabase
    .from("shopify_sync_logs")
    .select("id, sync_type, status, products_created, products_updated, error_message, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
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
      sellerFeeRate: Number(store.seller_fee_rate ?? 0.07),
      integrationEnabled: store.integration_enabled,
    },
    recentLogs: recentLogs ?? [],
  };
}

async function callShopifyFunction<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${getFunctionsBaseUrl()}/${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message ?? body.error ?? response.statusText;
    if (response.status === 404 || String(message).toLowerCase().includes("not found")) {
      throw new Error(
        "Shopify service is unavailable. Ensure Supabase edge functions are deployed (shopify-oauth-start, shopify-sync, shopify-disconnect)."
      );
    }
    throw new Error(message || "Shopify request failed");
  }
  return body as T;
}

export async function startShopifyOAuth(shopDomain: string): Promise<{ url: string; shopDomain: string }> {
  return callShopifyFunction("shopify-oauth-start", {
    method: "POST",
    body: JSON.stringify({ shopDomain }),
  });
}

export async function syncShopifyNow(): Promise<{
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
}> {
  return callShopifyFunction("shopify-sync", { method: "POST" });
}

export async function disconnectShopify(): Promise<void> {
  await callShopifyFunction("shopify-disconnect", { method: "POST" });
}
