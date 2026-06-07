import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MARKET_TICKER_FALLBACK,
  type MarketTickerItem,
} from "@/constants/marketTicker";

const CACHE_KEY = "crownly_market_ticker_v1";
const CACHE_TTL_MS = 15 * 60 * 1000;

export type MarketTickerResponse = {
  items: MarketTickerItem[];
  sources: string[];
  updatedAt: string;
  fromCache?: boolean;
  isFallback?: boolean;
};

type CachedPayload = MarketTickerResponse & { cachedAt: number };

function getFunctionsBaseUrl(): string | null {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (apiUrl) return apiUrl;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/functions/v1`;
}

async function readCache(): Promise<MarketTickerResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed.items?.length) return null;

    return {
      items: parsed.items,
      sources: parsed.sources ?? [],
      updatedAt: parsed.updatedAt,
      fromCache: true,
    };
  } catch {
    return null;
  }
}

async function writeCache(payload: MarketTickerResponse): Promise<void> {
  try {
    const cached: CachedPayload = { ...payload, cachedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore cache write failures.
  }
}

function isFreshCache(cachedAt: number): boolean {
  return Date.now() - cachedAt < CACHE_TTL_MS;
}

export async function fetchMarketTicker(): Promise<MarketTickerResponse> {
  const baseUrl = getFunctionsBaseUrl();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  let cached: CachedPayload | null = null;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw) as CachedPayload;
  } catch {
    cached = null;
  }

  if (cached && isFreshCache(cached.cachedAt)) {
    return {
      items: cached.items,
      sources: cached.sources ?? [],
      updatedAt: cached.updatedAt,
      fromCache: true,
    };
  }

  if (!baseUrl || !anonKey) {
    return {
      items: MARKET_TICKER_FALLBACK,
      sources: ["fallback"],
      updatedAt: new Date().toISOString(),
      isFallback: true,
    };
  }

  try {
    const response = await fetch(`${baseUrl}/market-ticker`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Market ticker HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      items?: MarketTickerItem[];
      sources?: string[];
      updatedAt?: string;
    };

    const items = (data.items ?? []).filter((item) => item.price > 0);

    if (!items.length) {
      throw new Error("Market ticker returned no items");
    }

    const payload: MarketTickerResponse = {
      items,
      sources: data.sources ?? [],
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };

    await writeCache(payload);
    return payload;
  } catch {
    if (cached?.items?.length) {
      return {
        items: cached.items,
        sources: cached.sources ?? [],
        updatedAt: cached.updatedAt,
        fromCache: true,
      };
    }

    const stale = await readCache();
    if (stale?.items.length) {
      return stale;
    }

    return {
      items: MARKET_TICKER_FALLBACK,
      sources: ["fallback"],
      updatedAt: new Date().toISOString(),
      isFallback: true,
    };
  }
}
