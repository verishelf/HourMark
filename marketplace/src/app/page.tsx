import Link from "next/link";
import { WatchCard } from "@/components/WatchCard";
import { createClient } from "@/lib/supabase/server";
import { getListings } from "@/services/listings";
import { LUXURY_BRANDS } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const listings = await getListings(supabase);
  const featured = listings.slice(0, 8);

  return (
    <>
      {/* Hero — Chrono24-style search-first landing, Crownly dark theme */}
      <section className="border-b border-border bg-gradient-to-b from-card to-background">
        <div className="mx-auto max-w-[1400px] px-4 py-12 text-center md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Authenticated luxury watches
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Find your next grail
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted md:text-base">
            Browse verified Rolex, Patek Philippe, Audemars Piguet, and more — with AI trust
            scores and escrow checkout.
          </p>
          <Link
            href="/search"
            className="mt-8 inline-block rounded-sm bg-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-black hover:opacity-90"
          >
            Browse all watches
          </Link>
        </div>
      </section>

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
