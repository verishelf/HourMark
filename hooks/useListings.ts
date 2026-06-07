import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeContentRefresh } from "@/lib/contentRefresh";
import { getListings } from "@/services/listings";
import type { Listing } from "@/types";

type ListingFilters = {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  search?: string;
};

export function useListings(filters?: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  const fetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    if (!hasLoadedOnceRef.current) {
      setLoading(true);
    }

    try {
      const data = await getListings(filters);
      if (isStale()) return;
      setListings(data);
      hasLoadedOnceRef.current = true;
    } catch {
      if (isStale()) return;
      if (!hasLoadedOnceRef.current) {
        setListings([]);
      }
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    void fetch();
  }, [fetch]);

  useEffect(() => subscribeContentRefresh(fetch), [fetch]);

  return { listings, loading, refetch: fetch };
}
