import Link from "next/link";
import { WatchCard } from "@/components/WatchCard";
import { HomeHero } from "@/components/HomeHero";
import { createPublicClient } from "@/lib/supabase/public";
import { getListings } from "@/services/listings";
import { LUXURY_BRANDS } from "@/lib/types";

export default async function HomePage() {
  const supabase = createPublicClient();
  const listings = await getListings(supabase);
  const featured = listings.slice(0, 8);

  return (
    <>
      <HomeHero />

      {/* Popular brands — horizontal pills like Chrono24 brand row */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1400px] px-4 py-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
            Popular brands
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {LUXURY_BRANDS.map((brand) => (
              <Link
                key={brand}
                href={`/search?brand=${encodeURIComponent(brand)}`}
                className="shrink-0 rounded-sm border border-border-light px-4 py-2 text-sm text-muted transition hover:border-gold hover:text-foreground"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured grid */}
      <section className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">New arrivals</h2>
            <p className="text-sm text-muted">{listings.length} verified listings</p>
          </div>
          <Link href="/search" className="text-sm text-gold hover:underline">
            View all →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((l) => (
              <WatchCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted">
            Listings will appear here once sellers publish verified watches.
          </p>
        )}
      </section>
    </>
  );
}
