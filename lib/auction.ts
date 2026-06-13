import type { Listing } from "@/types";

export const AUCTION_DURATIONS = [
  { days: 1, label: "24 hours" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
] as const;

export const AUCTION_BID_INCREMENT_CENTS = 10_000; // $100

export type SaleMode = "fixed" | "auction";

export function isAuctionListing(listing: Pick<Listing, "sale_mode">): boolean {
  return listing.sale_mode === "auction";
}

export function getAuctionEndTime(listing: Pick<Listing, "auction_ends_at">): Date | null {
  if (!listing.auction_ends_at) return null;
  const end = new Date(listing.auction_ends_at);
  return Number.isNaN(end.getTime()) ? null : end;
}

export function isAuctionEnded(listing: Pick<Listing, "auction_ends_at">): boolean {
  const end = getAuctionEndTime(listing);
  if (!end) return false;
  return end.getTime() <= Date.now();
}

export function isAuctionLive(
  listing: Pick<Listing, "sale_mode" | "status" | "auction_ends_at">
): boolean {
  return (
    isAuctionListing(listing) &&
    listing.status === "active" &&
    !isAuctionEnded(listing) &&
    Boolean(listing.auction_ends_at)
  );
}

export function getAuctionStartingBid(
  listing: Pick<Listing, "auction_starting_bid" | "price">
): number {
  return listing.auction_starting_bid ?? listing.price;
}

export function getAuctionDisplayBid(
  listing: Pick<Listing, "auction_current_bid" | "auction_starting_bid" | "price">
): number {
  return listing.auction_current_bid ?? getAuctionStartingBid(listing);
}

export function getMinimumBidCents(
  listing: Pick<Listing, "auction_current_bid" | "auction_starting_bid" | "price">
): number {
  if (listing.auction_current_bid != null) {
    return listing.auction_current_bid + AUCTION_BID_INCREMENT_CENTS;
  }
  return getAuctionStartingBid(listing);
}

export function formatAuctionCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "Ended";

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export function getMsUntilAuctionEnd(listing: Pick<Listing, "auction_ends_at">): number {
  const end = getAuctionEndTime(listing);
  if (!end) return 0;
  return Math.max(0, end.getTime() - Date.now());
}
