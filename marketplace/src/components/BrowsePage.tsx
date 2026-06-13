"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Listing, SortOption } from "@/lib/types";
import { sortListings } from "@/lib/types";
import { FilterSidebar, type FilterState } from "@/components/FilterSidebar";
import { SortBar } from "@/components/SortBar";
import { WatchCard } from "@/components/WatchCard";
import { useSupabase } from "@/hooks/useSupabase";
import { getListings } from "@/services/listings";

type Props = {
  initialListings: Listing[];
  initialQuery?: string;
  initialBrand?: string;
};

const emptyFilters: FilterState = {
  brands: [],
  minPrice: "",
  maxPrice: "",
  condition: "",
};

/** Chrono24-style browse — sidebar filters + results grid */
export function BrowsePage({ initialListings, initialQuery, initialBrand }: Props) {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState(initialListings);
  const [sort, setSort] = useState<SortOption>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ...emptyFilters,
    brands: initialBrand ? [initialBrand] : [],
  });

  const sorted = useMemo(() => sortListings(listings, sort), [listings, sort]);

  const applyFilters = useCallback(async () => {
    const results = await getListings(supabase, {
      brands: filters.brands.length ? filters.brands : undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) * 100 : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) * 100 : undefined,
      condition: filters.condition || undefined,
      search: initialQuery || undefined,
    });
    setListings(results);
    setMobileFiltersOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    if (filters.brands.length === 1) params.set("brand", filters.brands[0]);
    else params.delete("brand");
    router.replace(`/search?${params.toString()}`);
  }, [supabase, filters, initialQuery, router, searchParams]);

  const resetFilters = () => {
    setFilters(emptyFilters);
    getListings(supabase, { search: initialQuery }).then(setListings);
    router.replace(initialQuery ? `/search?q=${encodeURIComponent(initialQuery)}` : "/search");
  };

  const title = initialQuery
    ? `Results for "${initialQuery}"`
    : filters.brands.length === 1
      ? filters.brands[0]
      : "Luxury watches";

  return (
    <div className="mx-auto flex max-w-[1400px]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-lg bg-card">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
        <SortBar count={sorted.length} sort={sort} onSortChange={setSort} title={title} />

        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="mb-4 w-full rounded-sm border border-border-light py-2.5 text-sm md:hidden"
        >
          Filters {filters.brands.length ? `(${filters.brands.length})` : ""}
        </button>

        {sorted.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted">No watches match your filters</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 text-sm text-gold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((listing) => (
              <WatchCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
