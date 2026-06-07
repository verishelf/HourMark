export type TickerListingRow = {
  brand: string;
  model: string;
  reference_number: string | null;
  price: number;
  created_at: string;
};

export type TickerOrderRow = {
  amount: number;
  created_at: string;
  listing: {
    brand: string;
    model: string;
    reference_number: string | null;
  } | null;
};

export type BenchmarkConfig = {
  id: string;
  name: string;
  reference: string;
  brandMatch: string;
  modelMatch?: string;
  referenceMatch?: string;
  watchChartsBrand?: string;
  watchChartsReference?: string;
};

export type MarketTickerPayloadItem = {
  id: string;
  name: string;
  reference: string;
  price: number;
  changePercent: number;
  source: string;
};

export const MARKET_TICKER_BENCHMARKS: BenchmarkConfig[] = [
  {
    id: "sub",
    name: "Rolex Submariner",
    reference: "126610LN",
    brandMatch: "Rolex",
    modelMatch: "Submariner",
    referenceMatch: "126610",
    watchChartsBrand: "rolex",
    watchChartsReference: "126610ln",
  },
  {
    id: "nautilus",
    name: "Patek Nautilus",
    reference: "5711/1A",
    brandMatch: "Patek",
    modelMatch: "Nautilus",
    referenceMatch: "5711",
    watchChartsBrand: "patek philippe",
    watchChartsReference: "5711",
  },
  {
    id: "ro",
    name: "AP Royal Oak",
    reference: "15500ST",
    brandMatch: "Audemars",
    modelMatch: "Royal Oak",
    referenceMatch: "15500",
    watchChartsBrand: "audemars piguet",
    watchChartsReference: "15500",
  },
  {
    id: "speedy",
    name: "Omega Speedmaster",
    reference: "310.30",
    brandMatch: "Omega",
    modelMatch: "Speedmaster",
    referenceMatch: "310.30",
    watchChartsBrand: "omega",
    watchChartsReference: "310.30",
  },
  {
    id: "daytona",
    name: "Rolex Daytona",
    reference: "116500LN",
    brandMatch: "Rolex",
    modelMatch: "Daytona",
    referenceMatch: "116500",
    watchChartsBrand: "rolex",
    watchChartsReference: "116500ln",
  },
  {
    id: "bb58",
    name: "Tudor Black Bay 58",
    reference: "M79030N",
    brandMatch: "Tudor",
    modelMatch: "Black Bay",
    referenceMatch: "79030",
    watchChartsBrand: "tudor",
    watchChartsReference: "79030",
  },
  {
    id: "gmt",
    name: "Rolex GMT-Master II",
    reference: "126710BLNR",
    brandMatch: "Rolex",
    modelMatch: "GMT",
    referenceMatch: "126710",
    watchChartsBrand: "rolex",
    watchChartsReference: "126710blnr",
  },
  {
    id: "aquanaut",
    name: "Patek Aquanaut",
    reference: "5167A",
    brandMatch: "Patek",
    modelMatch: "Aquanaut",
    referenceMatch: "5167",
    watchChartsBrand: "patek philippe",
    watchChartsReference: "5167",
  },
];

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentChange(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function listingMatchesBenchmark(
  listing: Pick<TickerListingRow, "brand" | "model" | "reference_number">,
  benchmark: BenchmarkConfig
): boolean {
  const brand = listing.brand?.toLowerCase() ?? "";
  if (!brand.includes(benchmark.brandMatch.toLowerCase())) return false;

  if (benchmark.modelMatch) {
    const model = listing.model?.toLowerCase() ?? "";
    if (!model.includes(benchmark.modelMatch.toLowerCase())) return false;
  }

  if (benchmark.referenceMatch) {
    const ref = (listing.reference_number ?? "").toLowerCase().replace(/\s/g, "");
    if (!ref.includes(benchmark.referenceMatch.toLowerCase().replace(/\s/g, ""))) {
      return false;
    }
  }

  return true;
}

function orderMatchesBenchmark(order: TickerOrderRow, benchmark: BenchmarkConfig): boolean {
  if (!order.listing) return false;
  return listingMatchesBenchmark(order.listing, benchmark);
}

function centsToUsd(cents: number): number {
  return Math.round(cents / 100);
}

export function buildBenchmarkFromCrownly(
  benchmark: BenchmarkConfig,
  listings: TickerListingRow[],
  orders: TickerOrderRow[],
  now = Date.now()
): MarketTickerPayloadItem | null {
  const matchedListings = listings.filter((row) => listingMatchesBenchmark(row, benchmark));
  const matchedOrders = orders.filter((row) => orderMatchesBenchmark(row, benchmark));

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const recentCutoff = now - thirtyDaysMs;
  const priorCutoff = now - thirtyDaysMs * 2;

  let priceUsd: number | null = null;
  let source = "crownly_listings";

  if (matchedListings.length) {
    priceUsd = centsToUsd(median(matchedListings.map((row) => row.price)) ?? 0);
  }

  const recentSales = matchedOrders
    .filter((row) => new Date(row.created_at).getTime() >= recentCutoff)
    .map((row) => row.amount);
  const priorSales = matchedOrders
    .filter((row) => {
      const ts = new Date(row.created_at).getTime();
      return ts >= priorCutoff && ts < recentCutoff;
    })
    .map((row) => row.amount);

  if (recentSales.length) {
    const saleMedian = centsToUsd(median(recentSales) ?? 0);
    if (priceUsd == null) {
      priceUsd = saleMedian;
      source = "crownly_sales";
    }
  }

  if (priceUsd == null) return null;

  let changePercent = 0;

  const recentSaleAvg = average(recentSales);
  const priorSaleAvg = average(priorSales);
  if (recentSaleAvg != null && priorSaleAvg != null && priorSaleAvg > 0) {
    changePercent = percentChange(recentSaleAvg, priorSaleAvg);
  } else if (matchedListings.length >= 2) {
    const recentListingPrices = matchedListings
      .filter((row) => new Date(row.created_at).getTime() >= recentCutoff)
      .map((row) => row.price);
    const priorListingPrices = matchedListings
      .filter((row) => {
        const ts = new Date(row.created_at).getTime();
        return ts >= priorCutoff && ts < recentCutoff;
      })
      .map((row) => row.price);

    const recentMedian = median(recentListingPrices);
    const priorMedian = median(priorListingPrices);
    if (recentMedian != null && priorMedian != null && priorMedian > 0) {
      changePercent = percentChange(recentMedian, priorMedian);
    }
  }

  return {
    id: benchmark.id,
    name: benchmark.name,
    reference: benchmark.reference,
    price: priceUsd,
    changePercent: roundPercent(changePercent),
    source,
  };
}

export function buildLiveInventoryTickers(
  listings: TickerListingRow[],
  existingIds: Set<string>,
  limit = 4
): MarketTickerPayloadItem[] {
  const extras: MarketTickerPayloadItem[] = [];
  const seen = new Set<string>();

  const sorted = [...listings].sort((a, b) => b.price - a.price);

  for (const listing of sorted) {
    if (extras.length >= limit) break;

    const key = `${listing.brand}|${listing.model}|${listing.reference_number ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const id = `live-${key.replace(/[^a-z0-9]+/g, "-").slice(0, 48)}`;
    if (existingIds.has(id)) continue;

    const name = `${listing.brand} ${listing.model}`.trim();
    extras.push({
      id,
      name,
      reference: listing.reference_number?.trim() || listing.model,
      price: centsToUsd(listing.price),
      changePercent: 0,
      source: "crownly_listings",
    });
  }

  return extras;
}

type WatchChartsSearchResult = {
  success?: boolean;
  results?: { uuid?: string }[];
};

type WatchChartsInfoResult = {
  success?: boolean;
  market_price?: number;
  price?: number;
};

type WatchChartsHistoryPoint = {
  price?: number;
  value?: number;
};

type WatchChartsHistoryResult = {
  success?: boolean;
  history?: WatchChartsHistoryPoint[];
  prices?: WatchChartsHistoryPoint[];
};

export async function fetchWatchChartsBenchmark(
  benchmark: BenchmarkConfig,
  apiKey: string
): Promise<MarketTickerPayloadItem | null> {
  const brand = benchmark.watchChartsBrand ?? benchmark.brandMatch;
  const reference = benchmark.watchChartsReference ?? benchmark.reference;

  const searchUrl = new URL("https://api.watchcharts.com/v3/search/watch");
  searchUrl.searchParams.set("brand_name", brand);
  searchUrl.searchParams.set("reference", reference);

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { "x-api-key": apiKey },
  });
  if (!searchRes.ok) return null;

  const searchData = (await searchRes.json()) as WatchChartsSearchResult;
  const uuid = searchData.results?.[0]?.uuid;
  if (!uuid) return null;

  const infoUrl = new URL("https://api.watchcharts.com/v3/watch/info");
  infoUrl.searchParams.set("uuid", uuid);
  infoUrl.searchParams.set("currency", "USD");

  const infoRes = await fetch(infoUrl.toString(), {
    headers: { "x-api-key": apiKey },
  });
  if (!infoRes.ok) return null;

  const infoData = (await infoRes.json()) as WatchChartsInfoResult;
  const priceUsd = Math.round(infoData.market_price ?? infoData.price ?? 0);
  if (!priceUsd) return null;

  let changePercent = 0;
  const historyUrl = new URL("https://api.watchcharts.com/v3/watch/price_1y");
  historyUrl.searchParams.set("uuid", uuid);
  historyUrl.searchParams.set("currency", "USD");

  const historyRes = await fetch(historyUrl.toString(), {
    headers: { "x-api-key": apiKey },
  });

  if (historyRes.ok) {
    const historyData = (await historyRes.json()) as WatchChartsHistoryResult;
    const points = historyData.history ?? historyData.prices ?? [];
    const values = points
      .map((point) => point.price ?? point.value)
      .filter((value): value is number => typeof value === "number" && value > 0);

    if (values.length >= 2) {
      changePercent = percentChange(values[values.length - 1], values[0]);
    }
  }

  return {
    id: benchmark.id,
    name: benchmark.name,
    reference: benchmark.reference,
    price: priceUsd,
    changePercent: roundPercent(changePercent),
    source: "watchcharts",
  };
}
