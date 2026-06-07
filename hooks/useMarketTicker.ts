import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { MARKET_TICKER_FALLBACK, type MarketTickerItem } from "@/constants/marketTicker";
import { fetchMarketTicker, type MarketTickerResponse } from "@/services/marketTicker";

export function useMarketTicker() {
  const [items, setItems] = useState<MarketTickerItem[]>(MARKET_TICKER_FALLBACK);
  const [sources, setSources] = useState<string[]>(["fallback"]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const data: MarketTickerResponse = await fetchMarketTicker();
      if (requestId !== requestIdRef.current) return;

      setItems(data.items);
      setSources(data.sources);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === "active") {
        void load();
      }
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, [load]);

  const isLive = sources.some(
    (source) =>
      source.startsWith("crownly") || source === "watchcharts" || source === "mixed"
  );

  return { items, sources, loading, isLive, refresh: load };
}
