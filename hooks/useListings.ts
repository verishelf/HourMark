import { useCallback, useEffect, useState } from "react";
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

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getListings(filters);
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { listings, loading, refetch: fetch };
}
