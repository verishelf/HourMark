import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ListingBid } from "@/types";

const mockBids = new Map<string, ListingBid[]>();

export async function placeBid(listingId: string, amountCents: number): Promise<ListingBid> {
  if (!isSupabaseConfigured) {
    const bid: ListingBid = {
      id: `mock-bid-${Date.now()}`,
      listing_id: listingId,
      bidder_id: "mock-user",
      amount: amountCents,
      created_at: new Date().toISOString(),
    };
    const existing = mockBids.get(listingId) ?? [];
    mockBids.set(listingId, [bid, ...existing]);
    return bid;
  }

  const { data, error } = await supabase.rpc("place_listing_bid", {
    p_listing_id: listingId,
    p_amount: amountCents,
  });

  if (error) throw error;
  return data as ListingBid;
}

export async function getListingBids(listingId: string, limit = 10): Promise<ListingBid[]> {
  if (!isSupabaseConfigured) {
    return (mockBids.get(listingId) ?? []).slice(0, limit);
  }

  const { data, error } = await supabase
    .from("listing_bids")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ListingBid[];
}
