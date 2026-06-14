import type { SupabaseClient } from "@supabase/supabase-js";
import type { Listing } from "@/lib/types";
import { getCoverImage, isSupabaseConfigured } from "@/lib/site";

function normalize(listing: Listing): Listing {
  const images = (listing.images ?? [])
    .map((u) => getCoverImage([u]))
    .filter((u): u is string => Boolean(u));
  return { ...listing, images };
}

export async function getListings(
  supabase: SupabaseClient | null,
  filters?: {
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    search?: string;
  }
): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  let query = supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("status", "active")
    .eq("authentication_status", "auto_verified")
    .order("created_at", { ascending: false });

  if (filters?.brands?.length) {
    const or = filters.brands.map((b) => `brand.ilike.%${b}%`).join(",");
    query = query.or(or);
  }
  if (filters?.minPrice) query = query.gte("price", filters.minPrice);
  if (filters?.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters?.condition) query = query.eq("condition", filters.condition);
  if (filters?.search) {
    query = query.or(
      `brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((l) => normalize(l as Listing)).filter((l) => l.images.length > 0);
}

export async function getListingById(
  supabase: SupabaseClient | null,
  id: string
): Promise<Listing | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("id", id)
    .maybeSingle();
  return data ? normalize(data as Listing) : null;
}

export async function getRelatedListings(
  supabase: SupabaseClient | null,
  listing: Listing,
  limit = 4
): Promise<Listing[]> {
  const all = await getListings(supabase, { brands: [listing.brand] });
  return all.filter((l) => l.id !== listing.id).slice(0, limit);
}
