export type ListingRow = {
  id: string;
  brand: string;
  model: string;
  reference_number: string | null;
  price: number;
  images: string[] | null;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  amount: number;
  created_at: string;
  listing_id: string;
  listing: ListingRow | ListingRow[] | null;
};

export type RecentSalePayload = {
  id: string;
  listingId: string;
  brand: string;
  model: string;
  reference: string | null;
  price: number;
  imageUrl: string | null;
  soldAt: string;
};

function resolveListingImageUrl(supabaseUrl: string, uri: string | null | undefined): string | null {
  if (!uri) return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const path = trimmed.replace(/^\/+/, "");
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/listing-images/${path}`;
}

function getCoverImage(supabaseUrl: string, images: string[] | null | undefined): string | null {
  if (!images?.length) return null;
  for (const raw of images) {
    const resolved = resolveListingImageUrl(supabaseUrl, raw);
    if (resolved) return resolved;
  }
  return null;
}

function unwrapListing(listing: OrderRow["listing"]): ListingRow | null {
  if (!listing) return null;
  return Array.isArray(listing) ? listing[0] ?? null : listing;
}

function centsToUsd(cents: number): number {
  return Math.round(cents / 100);
}

function toSaleItem(
  supabaseUrl: string,
  input: {
    id: string;
    listingId: string;
    brand: string;
    model: string;
    reference: string | null;
    priceCents: number;
    images: string[] | null;
    soldAt: string;
  }
): RecentSalePayload {
  return {
    id: input.id,
    listingId: input.listingId,
    brand: input.brand,
    model: input.model,
    reference: input.reference,
    price: centsToUsd(input.priceCents),
    imageUrl: getCoverImage(supabaseUrl, input.images),
    soldAt: input.soldAt,
  };
}

export function mapOrdersToRecentSales(
  supabaseUrl: string,
  orders: OrderRow[]
): RecentSalePayload[] {
  const items: RecentSalePayload[] = [];
  const seenListings = new Set<string>();

  for (const order of orders) {
    const listing = unwrapListing(order.listing);
    if (!listing || seenListings.has(listing.id)) continue;

    seenListings.add(listing.id);
    items.push(
      toSaleItem(supabaseUrl, {
        id: order.id,
        listingId: listing.id,
        brand: listing.brand,
        model: listing.model,
        reference: listing.reference_number,
        priceCents: order.amount,
        images: listing.images,
        soldAt: order.created_at,
      })
    );
  }

  return items;
}

export function appendSoldListings(
  supabaseUrl: string,
  existing: RecentSalePayload[],
  listings: ListingRow[],
  limit = 24
): RecentSalePayload[] {
  const seen = new Set(existing.map((item) => item.listingId));
  const merged = [...existing];

  for (const listing of listings) {
    if (merged.length >= limit) break;
    if (seen.has(listing.id)) continue;

    seen.add(listing.id);
    merged.push(
      toSaleItem(supabaseUrl, {
        id: `listing-${listing.id}`,
        listingId: listing.id,
        brand: listing.brand,
        model: listing.model,
        reference: listing.reference_number,
        priceCents: listing.price,
        images: listing.images,
        soldAt: listing.updated_at,
      })
    );
  }

  return merged;
}
