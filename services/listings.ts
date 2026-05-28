import { MOCK_LISTINGS } from "@/data/mockListings";
import { getImageContentType } from "@/lib/listingImages";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { CreateListingInput, Listing } from "@/types";

const mockArchivedIds = new Set<string>();
const mockListingUpdates = new Map<string, Partial<Listing>>();
const mockUserListings: Listing[] = [];

function allMockListings(): Listing[] {
  const byId = new Map<string, Listing>();
  for (const listing of MOCK_LISTINGS) {
    byId.set(listing.id, listing);
  }
  for (const listing of mockUserListings) {
    byId.set(listing.id, listing);
  }
  return Array.from(byId.values());
}

function applyMockListingState(listings: Listing[]): Listing[] {
  return listings
    .filter((l) => !mockArchivedIds.has(l.id))
    .map((l) => ({ ...l, ...mockListingUpdates.get(l.id) }));
}

export async function getListings(filters?: {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  search?: string;
}): Promise<Listing[]> {
  if (!isSupabaseConfigured) {
    return filterMockListings(applyMockListingState(allMockListings()), filters);
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
    const listing = applyMockListingState(allMockListings()).find((l) => l.id === id);
    return listing ?? null;
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
    mockUserListings.unshift(mock);
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

export async function getSellerActiveListings(sellerId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured) {
    return applyMockListingState(allMockListings()).filter(
      (l) => l.seller_id === sellerId && l.status === "active"
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function getUserListings(userId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured) {
    return applyMockListingState(
      allMockListings().filter((l) => l.seller_id === userId)
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", userId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function updateListing(
  listingId: string,
  sellerId: string,
  input: Partial<CreateListingInput>
): Promise<Listing> {
  if (!isSupabaseConfigured) {
    const base = MOCK_LISTINGS.find((l) => l.id === listingId);
    if (!base || base.seller_id !== sellerId) {
      throw new Error("Listing not found");
    }
    const previous = mockListingUpdates.get(listingId) ?? {};
    const updated = { ...base, ...previous, ...input } as Listing;
    mockListingUpdates.set(listingId, { ...previous, ...input });
    return updated;
  }

  const { data, error } = await supabase
    .from("listings")
    .update(input)
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .select()
    .single();
  if (error) throw error;
  return data as Listing;
}

export async function deleteListing(
  listingId: string,
  sellerId: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    const existing = MOCK_LISTINGS.find((l) => l.id === listingId);
    if (!existing || existing.seller_id !== sellerId) {
      throw new Error("Listing not found");
    }
    mockArchivedIds.add(listingId);
    return;
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "archived" })
    .eq("id", listingId)
    .eq("seller_id", sellerId);
  if (error) throw error;
}

export async function uploadListingImage(
  userId: string,
  uri: string,
  index: number
): Promise<string> {
  if (!isSupabaseConfigured) return uri;

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Could not read photo (${response.status}). Try picking it again.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Photo file is empty. Try picking it again.");
  }

  const { ext, contentType } = getImageContentType(uri);
  const path = `${userId}/${Date.now()}-${index}.${ext}`;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, arrayBuffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });
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
