import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RecentSaleItem } from "@/constants/recentSales";

const CACHE_KEY = "crownly_recent_sales_v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

export type RecentSalesResponse = {
  items: RecentSaleItem[];
  updatedAt: string;
  fromCache?: boolean;
};

type CachedPayload = RecentSalesResponse & { cachedAt: number };

function getFunctionsBaseUrl(): string | null {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (apiUrl) return apiUrl;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/functions/v1`;
}

async function readCache(): Promise<RecentSalesResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed.items?.length) return null;

    return {
      items: parsed.items,
      updatedAt: parsed.updatedAt,
      fromCache: true,
    };
  } catch {
    return null;
  }
}

async function writeCache(payload: RecentSalesResponse): Promise<void> {
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

export async function fetchRecentSales(): Promise<RecentSalesResponse> {
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
      updatedAt: cached.updatedAt,
      fromCache: true,
    };
  }

  if (!baseUrl || !anonKey) {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  try {
    const response = await fetch(`${baseUrl}/market-ticker`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Recent sales HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      items?: RecentSaleItem[];
      updatedAt?: string;
    };

    const payload: RecentSalesResponse = {
      items: data.items ?? [],
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };

    if (payload.items.length) {
      await writeCache(payload);
    }

    return payload;
  } catch {
    if (cached?.items?.length) {
      return {
        items: cached.items,
        updatedAt: cached.updatedAt,
        fromCache: true,
      };
    }

    const stale = await readCache();
    if (stale?.items.length) {
      return stale;
    }

    return { items: [], updatedAt: new Date().toISOString() };
  }
}
