import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import {
  appendSoldListings,
  mapOrdersToRecentSales,
  type ListingRow,
  type OrderRow,
} from "../_shared/recentSales.ts";

const CACHE_MS = 10 * 60 * 1000;
const MAX_ITEMS = 24;

let cached:
  | {
      expiresAt: number;
      body: { items: unknown[]; updatedAt: string };
    }
  | null = null;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "GET") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return jsonResponse(cached.body, 200, {
      "Cache-Control": "public, max-age=600",
    });
  }

  try {
    const supabase = getServiceClient();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        "id, amount, created_at, listing_id, listing:listings(id, brand, model, reference_number, price, images, updated_at)"
      )
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS);

    if (ordersError) {
      console.error("[market-ticker] orders", ordersError.message);
    }

    let items = mapOrdersToRecentSales(supabaseUrl, (orders ?? []) as OrderRow[]);

    if (items.length < MAX_ITEMS) {
      const { data: soldListings, error: listingsError } = await supabase
        .from("listings")
        .select("id, brand, model, reference_number, price, images, updated_at")
        .eq("status", "sold")
        .order("updated_at", { ascending: false })
        .limit(MAX_ITEMS);

      if (listingsError) {
        console.error("[market-ticker] listings", listingsError.message);
      } else {
        items = appendSoldListings(supabaseUrl, items, (soldListings ?? []) as ListingRow[], MAX_ITEMS);
      }
    }

    const body = {
      items,
      updatedAt: new Date().toISOString(),
    };

    cached = { expiresAt: now + CACHE_MS, body };

    return jsonResponse(body, 200, {
      "Cache-Control": "public, max-age=600",
    });
  } catch (error) {
    console.error("[market-ticker]", error);
    return jsonResponse({ message: "Failed to load recent sales" }, 500);
  }
});
