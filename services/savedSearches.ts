import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Listing, SavedSearch } from "@/types";

const MOCK_SEARCHES: SavedSearch[] = [];

export type SearchFilters = {
  search?: string;
  brand?: string;
  reference_number?: string;
  condition?: string;
  maxPrice?: number;
  minPrice?: number;
};

export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
  if (!isSupabaseConfigured) return MOCK_SEARCHES;

  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSearch[];
}

export async function saveSearch(
  userId: string,
  filters: SearchFilters,
  name?: string
): Promise<SavedSearch> {
  if (!isSupabaseConfigured) {
    const saved: SavedSearch = {
      id: `search-${Date.now()}`,
      user_id: userId,
      name: name ?? filters.brand ?? "Saved search",
      brand: filters.brand ?? null,
      reference_number: filters.reference_number ?? null,
      condition: filters.condition ?? null,
      max_price: filters.maxPrice ?? null,
      min_price: filters.minPrice ?? null,
      search_text: filters.search ?? null,
      alert_enabled: true,
      created_at: new Date().toISOString(),
    };
    MOCK_SEARCHES.unshift(saved);
    return saved;
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: userId,
      name: name ?? filters.brand ?? filters.search ?? "Saved search",
      brand: filters.brand ?? null,
      reference_number: filters.reference_number ?? null,
      condition: filters.condition ?? null,
      max_price: filters.maxPrice ?? null,
      min_price: filters.minPrice ?? null,
      search_text: filters.search ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SavedSearch;
}

export async function deleteSavedSearch(userId: string, searchId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = MOCK_SEARCHES.findIndex((s) => s.id === searchId);
    if (idx >= 0) MOCK_SEARCHES.splice(idx, 1);
    return;
  }

  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", searchId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function toggleSearchAlert(
  userId: string,
  searchId: string,
  enabled: boolean
): Promise<void> {
  if (!isSupabaseConfigured) {
    const s = MOCK_SEARCHES.find((x) => x.id === searchId);
    if (s) s.alert_enabled = enabled;
    return;
  }

  const { error } = await supabase
    .from("saved_searches")
    .update({ alert_enabled: enabled })
    .eq("id", searchId)
    .eq("user_id", userId);
  if (error) throw error;
}

export function listingMatchesSearch(listing: Listing, search: SavedSearch): boolean {
  if (listing.authentication_status && listing.authentication_status !== "auto_verified") {
    return false;
  }
  if (listing.status !== "active") return false;
  if (search.brand && listing.brand.toLowerCase() !== search.brand.toLowerCase()) return false;
  if (
    search.reference_number &&
    listing.reference_number?.toLowerCase() !== search.reference_number.toLowerCase()
  ) {
    return false;
  }
  if (search.condition && listing.condition !== search.condition) return false;
  if (search.max_price != null && listing.price > search.max_price) return false;
  if (search.min_price != null && listing.price < search.min_price) return false;
  if (search.search_text) {
    const q = search.search_text.toLowerCase();
    const hay = `${listing.brand} ${listing.model} ${listing.reference_number ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export async function checkSavedSearchMatches(
  userId: string,
  listing: Listing
): Promise<SavedSearch[]> {
  const searches = await getSavedSearches(userId);
  return searches.filter((s) => s.alert_enabled && listingMatchesSearch(listing, s));
}
