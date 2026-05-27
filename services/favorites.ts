import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Listing } from "@/types";
import { MOCK_LISTINGS } from "@/data/mockListings";

const mockFavorites = new Set<string>(["1", "3"]);

export async function getFavorites(userId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured) {
    return MOCK_LISTINGS.filter((l) => mockFavorites.has(l.id));
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("listing:listings(*, seller:users(*))")
    .eq("user_id", userId);
  if (error) throw error;
  const rows = (data ?? []) as unknown as { listing: Listing }[];
  return rows.map((f) => f.listing).filter(Boolean);
}

export async function isFavorite(
  userId: string,
  listingId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return mockFavorites.has(listingId);

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();
  return Boolean(data);
}

export async function toggleFavorite(
  userId: string,
  listingId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    if (mockFavorites.has(listingId)) {
      mockFavorites.delete(listingId);
      return false;
    }
    mockFavorites.add(listingId);
    return true;
  }

  const exists = await isFavorite(userId, listingId);
  if (exists) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);
    return false;
  }

  await supabase.from("favorites").insert({
    user_id: userId,
    listing_id: listingId,
  });
  return true;
}
