import { WatchCard } from "@/components/WatchCard";
import type { Listing } from "@/lib/types";

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (!listings.length) {
    return <p className="py-12 text-center text-muted">No active listings</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <WatchCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
