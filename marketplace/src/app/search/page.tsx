import { Suspense } from "react";
import { BrowsePage } from "@/components/BrowsePage";
import { createPublicClient } from "@/lib/supabase/public";
import { getListings } from "@/services/listings";

type Props = { searchParams: Promise<{ q?: string; brand?: string }> };

async function SearchContent({ q, brand }: { q?: string; brand?: string }) {
  const supabase = createPublicClient();
  const listings = await getListings(supabase, {
    search: q,
    brands: brand ? [brand] : undefined,
  });
  return (
    <BrowsePage initialListings={listings} initialQuery={q} initialBrand={brand} />
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading watches…</div>}>
      <SearchContent q={params.q} brand={params.brand} />
    </Suspense>
  );
}
