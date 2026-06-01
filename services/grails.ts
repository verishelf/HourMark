import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { createNotification } from "@/services/notifications";
import type { GrailRequest, Listing } from "@/types";

const MOCK_GRAILS: GrailRequest[] = [];

export type CreateGrailInput = {
  brand?: string;
  model?: string;
  reference_number?: string;
  max_budget?: number;
  min_condition?: string;
  notes?: string;
};

export async function getGrailRequests(status?: "active" | "fulfilled" | "cancelled"): Promise<GrailRequest[]> {
  if (!isSupabaseConfigured) {
    return status ? MOCK_GRAILS.filter((g) => g.status === status) : MOCK_GRAILS;
  }

  let query = supabase
    .from("grail_requests")
    .select("*, user:users(username, avatar_url)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as GrailRequest[];
}

export async function getUserGrailRequests(userId: string): Promise<GrailRequest[]> {
  if (!isSupabaseConfigured) {
    return MOCK_GRAILS.filter((g) => g.user_id === userId);
  }

  const { data, error } = await supabase
    .from("grail_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GrailRequest[];
}

export async function createGrailRequest(
  userId: string,
  input: CreateGrailInput
): Promise<GrailRequest> {
  if (!isSupabaseConfigured) {
    const grail: GrailRequest = {
      id: `grail-${Date.now()}`,
      user_id: userId,
      brand: input.brand ?? null,
      model: input.model ?? null,
      reference_number: input.reference_number ?? null,
      max_budget: input.max_budget ?? null,
      min_condition: input.min_condition ?? null,
      notes: input.notes ?? null,
      status: "active",
      created_at: new Date().toISOString(),
    };
    MOCK_GRAILS.unshift(grail);
    return grail;
  }

  const { data, error } = await supabase
    .from("grail_requests")
    .insert({ user_id: userId, ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data as GrailRequest;
}

export async function cancelGrailRequest(userId: string, grailId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const g = MOCK_GRAILS.find((x) => x.id === grailId);
    if (g) g.status = "cancelled";
    return;
  }

  await supabase
    .from("grail_requests")
    .update({ status: "cancelled" })
    .eq("id", grailId)
    .eq("user_id", userId);
}

export function listingMatchesGrail(listing: Listing, grail: GrailRequest): boolean {
  if (grail.status !== "active") return false;
  if (listing.status !== "active") return false;
  if (listing.authentication_status && listing.authentication_status !== "auto_verified") {
    return false;
  }
  if (grail.brand && listing.brand.toLowerCase() !== grail.brand.toLowerCase()) return false;
  if (grail.model && !listing.model.toLowerCase().includes(grail.model.toLowerCase())) return false;
  if (
    grail.reference_number &&
    listing.reference_number?.toLowerCase() !== grail.reference_number.toLowerCase()
  ) {
    return false;
  }
  if (grail.max_budget != null && listing.price > grail.max_budget) return false;
  if (grail.min_condition && listing.condition !== grail.min_condition) return false;
  return true;
}

export async function notifyGrailMatches(listing: Listing): Promise<void> {
  const grails = await getGrailRequests("active");
  for (const grail of grails) {
    if (listingMatchesGrail(listing, grail)) {
      await createNotification({
        userId: grail.user_id,
        type: "grail_match",
        title: "Grail watch found",
        body: `${listing.brand} ${listing.model} matches your hunt`,
        data: { listing_id: listing.id, grail_id: grail.id },
      });
    }
  }
}

export async function getPostsByReference(referenceNumber: string) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("user_posts")
    .select("*, author:users(username, avatar_url)")
    .eq("reference_number", referenceNumber)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function getListingsByReference(referenceNumber: string): Promise<Listing[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("reference_number", referenceNumber)
    .eq("status", "active")
    .eq("authentication_status", "auto_verified")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}
