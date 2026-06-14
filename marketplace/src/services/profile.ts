import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types";

export type ProfileUpdate = {
  username: string;
  full_name: string;
  bio: string;
};

export async function getProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url, bio, verified, seller_rating, total_sales")
    .eq("id", userId)
    .maybeSingle();
  return data as UserProfile | null;
}

export async function isUsernameAvailable(
  supabase: SupabaseClient,
  username: string,
  currentUserId: string
): Promise<boolean> {
  const trimmed = username.trim();
  if (!trimmed || trimmed.length < 3) return false;
  const { data } = await supabase
    .from("users")
    .select("id")
    .ilike("username", trimmed)
    .neq("id", currentUserId)
    .maybeSingle();
  return !data;
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  input: ProfileUpdate
): Promise<UserProfile> {
  const username = input.username.trim();
  if (!username || username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error("Username can only contain letters, numbers, and underscores");
  }

  const available = await isUsernameAvailable(supabase, username, userId);
  if (!available) throw new Error("This username is already taken");

  const { data, error } = await supabase
    .from("users")
    .update({
      username,
      full_name: input.full_name.trim() || null,
      bio: input.bio.trim() || null,
    })
    .eq("id", userId)
    .select("id, username, full_name, avatar_url, bio, verified, seller_rating, total_sales")
    .single();

  if (error) throw error;
  return data as UserProfile;
}
