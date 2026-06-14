"use server";

import { createClient } from "@/lib/supabase/server";
import { updateUserProfile, type ProfileUpdate } from "@/services/profile";
import { createSellerListing, type CreateListingInput } from "@/services/seller-listings";

export async function signOutAction(): Promise<{ ok: true }> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  return { ok: true };
}

export async function updateProfileAction(
  input: ProfileUpdate
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Not signed in" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  try {
    await updateUserProfile(supabase, user.id, input);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save profile" };
  }
}

export async function createListingAction(
  input: CreateListingInput
): Promise<{ listingId?: string; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) return { error: "Not signed in" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (!input.brand.trim() || !input.model.trim()) {
    return { error: "Brand and model are required" };
  }
  if (!input.price || input.price <= 0) {
    return { error: "Enter a valid price" };
  }
  if (!input.images.length) {
    return { error: "Add at least one image URL" };
  }

  try {
    const listing = await createSellerListing(supabase, user.id, input);
    return { listingId: listing.id, error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create listing" };
  }
}
