import { MOCK_LISTINGS } from "@/data/mockListings";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { CreateListingInput, Listing } from "@/types";

export async function getListings(filters?: {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  search?: string;
}): Promise<Listing[]> {
  if (!isSupabaseConfigured) {
    return filterMockListings(MOCK_LISTINGS, filters);
  }

  let query = supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters?.brand && filters.brand !== "All") {
    const brandMap: Record<string, string> = {
      AP: "Audemars Piguet",
    };
    query = query.ilike("brand", `%${brandMap[filters.brand] ?? filters.brand}%`);
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
  return (data ?? []) as Listing[];
}

export async function getListingById(id: string): Promise<Listing | null> {
  if (!isSupabaseConfigured) {
    return MOCK_LISTINGS.find((l) => l.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Listing;
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const all = await getListings();
  return all.slice(0, 3);
}

export async function getRelatedListings(
  listing: Listing,
  limit = 4
): Promise<Listing[]> {
  const all = await getListings({ brand: listing.brand });
  return all.filter((l) => l.id !== listing.id).slice(0, limit);
}

export async function createListing(
  sellerId: string,
  input: CreateListingInput
): Promise<Listing> {
  if (!isSupabaseConfigured) {
    const mock: Listing = {
      id: `mock-${Date.now()}`,
      seller_id: sellerId,
      ...input,
      reference_number: input.reference_number ?? null,
      year: input.year ?? null,
      description: input.description ?? null,
      serial_number: input.serial_number ?? null,
      status: "active",
      authenticated: false,
      created_at: new Date().toISOString(),
    };
    return mock;
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      seller_id: sellerId,
      ...input,
      status: "active",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Listing;
}

export async function getUserListings(userId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured) {
    return MOCK_LISTINGS.filter((l) => l.seller_id === userId);
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function uploadListingImage(
  userId: string,
  uri: string,
  index: number
): Promise<string> {
  if (!isSupabaseConfigured) return uri;

  const response = await fetch(uri);
  const blob = await response.blob();
  const ext = uri.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}-${index}.${ext}`;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, blob, { contentType: `image/${ext}` });
  if (error) throw error;

  const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
  return data.publicUrl;
}

function filterMockListings(
  listings: Listing[],
  filters?: {
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    search?: string;
  }
): Listing[] {
  let result = [...listings];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.brand.toLowerCase().includes(q) ||
        l.model.toLowerCase().includes(q) ||
        l.reference_number?.toLowerCase().includes(q)
    );
  }

  if (filters?.brand && filters.brand !== "All") {
    const brandMap: Record<string, string> = {
      AP: "Audemars Piguet",
    };
    const brand = brandMap[filters.brand] ?? filters.brand;
    result = result.filter((l) =>
      l.brand.toLowerCase().includes(brand.toLowerCase())
    );
  }

  if (filters?.minPrice) {
    result = result.filter((l) => l.price >= filters.minPrice!);
  }
  if (filters?.maxPrice) {
    result = result.filter((l) => l.price <= filters.maxPrice!);
  }
  if (filters?.condition) {
    result = result.filter((l) => l.condition === filters.condition);
  }

  return result;
}
