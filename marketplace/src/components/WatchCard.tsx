import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { getCoverImage } from "@/lib/site";

type Props = { listing: Listing };

/** Chrono24-style product card — image-first, brand/model hierarchy, price footer */
export function WatchCard({ listing }: Props) {
  const cover = getCoverImage(listing.images);
  const isAuction = listing.sale_mode === "auction";
  const displayPrice =
    isAuction && listing.auction_current_bid
      ? listing.auction_current_bid
      : listing.price;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card transition hover:border-border-light hover:bg-card-hover"
    >
      <div className="relative aspect-square bg-[#050505] p-4">
        {cover ? (
          <Image
            src={cover}
            alt={`${listing.brand} ${listing.model}`}
            fill
            unoptimized
            className="object-contain p-2 transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-dim">
            No image
          </div>
        )}
        {listing.ai_trust_score != null && listing.ai_trust_score >= 80 && (
          <span className="absolute left-2 top-2 rounded-sm bg-gold/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
            Verified
          </span>
        )}
        {isAuction && (
          <span className="absolute right-2 top-2 rounded-sm bg-black/80 px-1.5 py-0.5 text-[10px] text-gold">
            Auction
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col border-t border-border px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {listing.brand}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {listing.model}
        </p>
        {listing.reference_number && (
          <p className="mt-1 text-xs text-muted-dim">Ref. {listing.reference_number}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {formatPrice(displayPrice)}
            </p>
            {isAuction && !listing.auction_current_bid && (
              <p className="text-[10px] text-muted">Starting bid</p>
            )}
          </div>
          <span className="text-[10px] text-muted">{listing.condition}</span>
        </div>
        {listing.seller?.verified && (
          <p className="mt-2 border-t border-border pt-2 text-[10px] text-gold">
            ✓ Trusted seller
          </p>
        )}
      </div>
    </Link>
  );
}
