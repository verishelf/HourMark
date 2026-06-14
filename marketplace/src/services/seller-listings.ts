import type { SupabaseClient } from "@supabase/supabase-js";
import type { Listing } from "@/lib/types";
import { getCoverImage } from "@/lib/site";

function normalize(listing: Listing): Listing {
  const images = (listing.images ?? [])
    .map((u) => getCoverImage([u]))
    .filter((u): u is string => Boolean(u));
  return { ...listing, images };
}

export async function getMyListings(
  supabase: SupabaseClient,
  sellerId: string
): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((l) => normalize(l as Listing));
}

export type CreateListingInput = {
  brand: string;
  model: string;
  reference_number?: string;
  year?: number;
  condition: string;
  price: number;
  description?: string;
  images: string[];
  includes_box?: boolean;
  includes_papers?: boolean;
};

export async function createSellerListing(
  supabase: SupabaseClient,
  sellerId: string,
  input: CreateListingInput
): Promise<Listing> {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      seller_id: sellerId,
      brand: input.brand.trim(),
      model: input.model.trim(),
      reference_number: input.reference_number?.trim() || null,
      year: input.year ?? null,
      condition: input.condition,
      price: input.price,
      description: input.description?.trim() || null,
      images: input.images,
      includes_box: input.includes_box ?? false,
      includes_papers: input.includes_papers ?? false,
      accepts_offers: true,
      status: "draft",
      authentication_status: "pending",
      ai_trust_score: 0,
      fraud_flags: [],
      trust_badges: ["escrow_protected"],
      sale_mode: "fixed",
    })
    .select("*, seller:users(*)")
    .single();

  if (error) throw error;
  return normalize(data as Listing);
}
