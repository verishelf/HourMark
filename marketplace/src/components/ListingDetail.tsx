"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Listing } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { getCoverImage } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WatchCard } from "@/components/WatchCard";

type Props = { listing: Listing; related: Listing[] };

/** Chrono24-style product detail — gallery left, sticky buy box right, specs table */
export function ListingDetail({ listing, related }: Props) {
  const router = useRouter();
  const images = listing.images
    .map((u) => getCoverImage([u]))
    .filter((u): u is string => Boolean(u));
  const [active, setActive] = useState(0);
  const isAuction = listing.sale_mode === "auction";
  const price = isAuction
    ? listing.auction_current_bid ?? listing.auction_starting_bid ?? listing.price
    : listing.price;

  const specs: [string, string][] = [
    ["Brand", listing.brand],
    ["Model", listing.model],
    ...(listing.reference_number
      ? [["Reference", listing.reference_number] as [string, string]]
      : []),
    ...(listing.year ? [["Year", String(listing.year)] as [string, string]] : []),
    ["Condition", listing.condition],
    ["Listing ID", listing.id.slice(0, 8).toUpperCase()],
    ...(listing.includes_box ? [["Includes", "Original box"] as [string, string]] : []),
    ...(listing.includes_papers ? [["", "Papers"] as [string, string]] : []),
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Buy", href: "/search" },
          { label: listing.brand, href: `/search?brand=${encodeURIComponent(listing.brand)}` },
          { label: listing.model },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        {/* Gallery — Chrono24 main + thumbnails */}
        <div className="grid gap-4 md:grid-cols-[80px_1fr]">
          {images.length > 1 && (
            <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col">
              {images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border md:h-20 md:w-20 ${
                    i === active ? "border-gold" : "border-border"
                  }`}
                >
                  <Image src={img} alt="" fill unoptimized className="object-contain p-1" sizes="80px" />
                </button>
              ))}
            </div>
          )}
          <div className="relative order-1 aspect-square overflow-hidden rounded-sm border border-border bg-[#050505] md:order-2">
            {images[active] && (
              <Image
                src={images[active]}
                alt={`${listing.brand} ${listing.model}`}
                fill
                unoptimized
                className="object-contain p-6"
                sizes="(max-width:1024px) 100vw, 60vw"
              />
            )}
          </div>
        </div>

        {/* Buy box — sticky like Chrono24 */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-sm border border-border bg-card p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {listing.brand}
            </p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight md:text-3xl">
              {listing.model}
            </h1>
            {listing.reference_number && (
              <p className="mt-1 text-sm text-muted">Ref. {listing.reference_number}</p>
            )}

            <p className="mt-5 text-3xl font-semibold tracking-tight">
              {formatPrice(price)}
              {isAuction && !listing.auction_current_bid && (
                <span className="ml-2 text-sm font-normal text-muted">starting bid</span>
              )}
            </p>

            {listing.ai_trust_score != null && listing.ai_trust_score > 0 && (
              <div className="mt-4 rounded-sm bg-gold-muted px-3 py-2 text-sm text-gold">
                AI Trust Score: {listing.ai_trust_score}% · Escrow protected
              </div>
            )}

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => router.push(`/auth/login?redirect=/listing/${listing.id}`)}
                className="w-full rounded-sm bg-gold py-3.5 text-sm font-semibold uppercase tracking-wider text-black hover:opacity-90"
              >
                {isAuction ? "Sign in to bid" : "Buy now"}
              </button>
              {!isAuction && (
                <button
                  type="button"
                  onClick={() => router.push(`/auth/login?redirect=/listing/${listing.id}`)}
                  className="w-full rounded-sm border border-border-light py-3 text-sm font-medium text-foreground hover:border-gold hover:text-gold"
                >
                  Make an offer
                </button>
              )}
            </div>

            {listing.seller && (
              <Link
                href={`/seller/${listing.seller_id}`}
                className="mt-6 flex items-center gap-3 border-t border-border pt-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-border text-sm font-medium">
                  {(listing.seller.username ?? "S")[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {listing.seller.username ?? "Seller"}
                  </p>
                  {listing.seller.verified && (
                    <p className="text-xs text-gold">Verified dealer</p>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Specs table — Chrono24 key-value rows */}
      <section className="mt-10 border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 text-sm font-semibold uppercase tracking-wide">
          Specifications
        </h2>
        <dl className="divide-y divide-border">
          {specs.map(([key, val], i) =>
            key ? (
              <div key={i} className="grid grid-cols-2 gap-4 px-5 py-3 text-sm md:grid-cols-[200px_1fr]">
                <dt className="text-muted">{key}</dt>
                <dd>{val}</dd>
              </div>
            ) : null
          )}
        </dl>
      </section>

      {listing.description && (
        <section className="mt-6 border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Description</h2>
          <p className="text-sm leading-relaxed text-muted">{listing.description}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-lg font-semibold">Similar watches</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((l) => (
              <WatchCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
