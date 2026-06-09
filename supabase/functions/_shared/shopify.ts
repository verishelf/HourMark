import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { decryptShopifyToken } from "./shopify-crypto.ts";

export const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_inventory",
  "write_inventory",
].join(",");

export const LUXURY_BRANDS = [
  "Rolex",
  "Audemars Piguet",
  "Patek Philippe",
  "Cartier",
  "Omega",
  "Richard Mille",
  "Vacheron Constantin",
  "Jaeger-LeCoultre",
  "IWC",
  "Panerai",
  "Breitling",
  "Tudor",
  "Hublot",
  "A. Lange & Söhne",
];

export type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  tags: string;
  status: string;
  variants: ShopifyVariant[];
  images: { src: string }[];
};

export type ShopifyVariant = {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string | null;
  inventory_quantity: number;
  inventory_item_id: number;
};

export function normalizeShopDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/\/.*$/, "");
  if (!domain.includes(".")) {
    domain = `${domain}.myshopify.com`;
  }
  if (!domain.endsWith(".myshopify.com")) {
    throw new Error("Enter a valid Shopify store domain (e.g. your-store.myshopify.com)");
  }
  return domain;
}

export function getShopifyConfig() {
  const apiKey = Deno.env.get("SHOPIFY_API_KEY");
  const apiSecret = Deno.env.get("SHOPIFY_API_SECRET");
  if (!apiKey || !apiSecret) {
    throw new Error("Shopify API credentials are not configured");
  }
  return { apiKey, apiSecret };
}

export function buildOAuthUrl(shopDomain: string, state: string): string {
  const { apiKey } = getShopifyConfig();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
  const redirectUri = `${supabaseUrl}/functions/v1/shopify-oauth-callback`;
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeOAuthCode(
  shopDomain: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const { apiKey, apiSecret } = getShopifyConfig();
  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify OAuth failed: ${text}`);
  }
  return response.json();
}

export async function shopifyAdminFetch<T>(
  shopDomain: string,
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `https://${shopDomain}/admin/api/2024-10${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify API ${path}: ${response.status} ${text}`);
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

export async function verifyWebhookHmacAsync(
  rawBody: string,
  hmacHeader: string | null
): Promise<boolean> {
  if (!hmacHeader) return false;
  const { apiSecret } = getShopifyConfig();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return timingSafeEqual(computed, hmacHeader);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function parseWatchFromProduct(product: ShopifyProduct): {
  brand: string;
  model: string;
  referenceNumber: string | null;
  year: number | null;
  condition: string;
  caseMaterial: string | null;
} {
  const haystack = [
    product.title,
    product.vendor,
    product.product_type,
    product.tags,
    product.body_html ?? "",
  ].join(" ");

  let brand = product.vendor?.trim() || "Unknown";
  for (const candidate of LUXURY_BRANDS) {
    if (haystack.toLowerCase().includes(candidate.toLowerCase())) {
      brand = candidate;
      break;
    }
  }

  let model = product.title.replace(new RegExp(brand, "i"), "").trim() || product.title;
  const refMatch = haystack.match(/\b(?:ref\.?|reference)\s*[:#]?\s*([A-Za-z0-9\-./]+)/i);
  const referenceNumber = refMatch?.[1] ?? product.variants[0]?.sku ?? null;

  const yearMatch = haystack.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : null;

  const tagLower = product.tags.toLowerCase();
  let condition = "Excellent";
  if (tagLower.includes("unworn") || tagLower.includes("new")) condition = "Unworn";
  else if (tagLower.includes("like new")) condition = "Like New";
  else if (tagLower.includes("very good")) condition = "Very Good";
  else if (tagLower.includes("good")) condition = "Good";
  else if (tagLower.includes("fair")) condition = "Fair";

  const materialMatch = haystack.match(
    /\b(stainless steel|18k gold|rose gold|yellow gold|platinum|titanium|ceramic)\b/i
  );
  const caseMaterial = materialMatch?.[1] ?? null;

  return { brand, model, referenceNumber, year, condition, caseMaterial };
}

export async function getStoreAccessToken(
  supabase: SupabaseClient,
  storeId: string
): Promise<{ shopDomain: string; accessToken: string; dealerId: string; userId: string }> {
  const { data, error } = await supabase
    .from("dealer_shopify_stores")
    .select("shop_domain, access_token_encrypted, dealer_id, user_id, integration_enabled")
    .eq("id", storeId)
    .single();

  if (error || !data) throw new Error("Shopify store not found");
  if (!data.integration_enabled) throw new Error("Shopify integration is disabled");

  const accessToken = await decryptShopifyToken(data.access_token_encrypted);
  return {
    shopDomain: data.shop_domain,
    accessToken,
    dealerId: data.dealer_id,
    userId: data.user_id,
  };
}

export async function registerWebhooks(
  shopDomain: string,
  accessToken: string
): Promise<number[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
  const address = `${supabaseUrl}/functions/v1/shopify-webhook`;
  const topics = [
    "products/create",
    "products/update",
    "products/delete",
    "inventory_levels/update",
  ];
  const ids: number[] = [];

  for (const topic of topics) {
    const result = await shopifyAdminFetch<{ webhook: { id: number } }>(
      shopDomain,
      accessToken,
      "/webhooks.json",
      {
        method: "POST",
        body: JSON.stringify({
          webhook: { topic, address, format: "json" },
        }),
      }
    );
    if (result.webhook?.id) ids.push(result.webhook.id);
  }

  return ids;
}

export async function deleteWebhooks(
  shopDomain: string,
  accessToken: string,
  webhookIds: number[]
): Promise<void> {
  for (const id of webhookIds) {
    await shopifyAdminFetch(shopDomain, accessToken, `/webhooks/${id}.json`, {
      method: "DELETE",
    });
  }
}
