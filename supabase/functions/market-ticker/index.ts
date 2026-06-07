import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import {
  buildBenchmarkFromCrownly,
  buildLiveInventoryTickers,
  fetchWatchChartsBenchmark,
  MARKET_TICKER_BENCHMARKS,
  type TickerListingRow,
  type TickerOrderRow,
} from "../_shared/marketTicker.ts";

const CACHE_MS = 30 * 60 * 1000;
let cached:
  | {
      expiresAt: number;
      body: { items: unknown[]; sources: string[]; updatedAt: string };
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
      "Cache-Control": "public, max-age=1800",
    });
  }

  try {
    const supabase = getServiceClient();
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();

    const [listingsRes, ordersRes] = await Promise.all([
      supabase
        .from("listings")
        .select("brand, model, reference_number, price, created_at")
        .eq("status", "active")
        .eq("authentication_status", "auto_verified")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("orders")
        .select("amount, created_at, listing:listings(brand, model, reference_number)")
        .eq("status", "completed")
        .gte("created_at", sixtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const listings = (listingsRes.data ?? []) as TickerListingRow[];
    const orders = (ordersRes.data ?? []) as TickerOrderRow[];
    const watchChartsKey = Deno.env.get("WATCHCHARTS_API_KEY") ?? "";

    const items = [];
    const sources = new Set<string>();
    const usedIds = new Set<string>();

    for (const benchmark of MARKET_TICKER_BENCHMARKS) {
      let item = buildBenchmarkFromCrownly(benchmark, listings, orders, now);

      if (!item && watchChartsKey) {
        item = await fetchWatchChartsBenchmark(benchmark, watchChartsKey);
      }

      if (item) {
        items.push(item);
        sources.add(item.source);
        usedIds.add(item.id);
      }
    }

    for (const extra of buildLiveInventoryTickers(listings, usedIds)) {
      items.push(extra);
      sources.add(extra.source);
    }

    const body = {
      items,
      sources: Array.from(sources),
      updatedAt: new Date().toISOString(),
    };

    cached = { expiresAt: now + CACHE_MS, body };

    return jsonResponse(body, 200, {
      "Cache-Control": "public, max-age=1800",
    });
  } catch (error) {
    console.error("[market-ticker]", error);
    return jsonResponse({ message: "Failed to load market ticker" }, 500);
  }
});
