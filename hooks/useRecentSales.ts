import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { RecentSaleItem } from "@/constants/recentSales";
import { fetchRecentSales } from "@/services/recentSales";

export function useRecentSales() {
  const [items, setItems] = useState<RecentSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const data = await fetchRecentSales();
      if (requestId !== requestIdRef.current) return;
      setItems(data.items);
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

  return { items, loading, refresh: load };
}
