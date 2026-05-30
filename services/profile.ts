import { getImageContentType } from "@/lib/listingImages";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getProfile, updateProfile } from "@/services/auth";
import type { UserProfile } from "@/types";

export async function getPublicProfile(userId: string): Promise<UserProfile | null> {
  return getProfile(userId);
}

export type ProfileUpdateInput = {
  fullName: string;
  username: string;
  bio: string;
  avatarUri?: string | null;
};

export async function isUsernameAvailable(
  username: string,
  currentUserId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  if (!username.trim()) return false;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .ilike("username", username.trim())
    .neq("id", currentUserId)
    .maybeSingle();

  if (error) throw error;
  return !data;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
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
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, arrayBuffer, {
    contentType,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function saveProfile(
  userId: string,
  input: ProfileUpdateInput
): Promise<UserProfile> {
  const username = input.username.trim();
  if (!username) {
    throw new Error("Username is required");
  }
  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error("Username can only contain letters, numbers, and underscores");
  }

  const available = await isUsernameAvailable(username, userId);
  if (!available) {
    throw new Error("This username is already taken");
  }

  let avatarUrl: string | undefined;
  if (input.avatarUri) {
    avatarUrl = await uploadAvatar(userId, input.avatarUri);
  }

  return updateProfile(userId, {
    username,
    full_name: input.fullName.trim() || null,
    bio: input.bio.trim() || null,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  });
}
