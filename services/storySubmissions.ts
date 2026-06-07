import { getImageContentType } from "@/lib/listingImages";
import { toUserFacingError } from "@/lib/supabaseErrors";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { StorySubmission } from "@/types";

export async function submitStory(data: {
  userId: string;
  title: string;
  content: string;
  watchReference?: string;
  businessLesson?: string;
  networkingLesson?: string;
  photoUris?: string[];
  socialLinks?: Record<string, string>;
}): Promise<StorySubmission> {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");

  const photoUrls: string[] = [];
  for (const uri of data.photoUris ?? []) {
    const url = await uploadSubmissionPhoto(data.userId, uri);
    if (url) photoUrls.push(url);
  }

  const { data: row, error } = await supabase
    .from("story_submissions")
    .insert({
      user_id: data.userId,
      title: data.title,
      content: data.content,
      watch_reference: data.watchReference ?? null,
      business_lesson: data.businessLesson ?? null,
      networking_lesson: data.networkingLesson ?? null,
      photo_urls: photoUrls,
      social_links: data.socialLinks ?? {},
    })
    .select("*")
    .single();

  if (error) throw toUserFacingError(error);
  return row as StorySubmission;
}

async function uploadSubmissionPhoto(userId: string, uri: string): Promise<string | null> {
  const response = await fetch(uri);
  if (!response.ok) return null;
  const arrayBuffer = await response.arrayBuffer();
  const { ext, contentType } = getImageContentType(uri);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("story-images")
    .upload(path, arrayBuffer, { contentType });
  if (error) throw toUserFacingError(error);
  const { data } = supabase.storage.from("story-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function getMySubmissions(userId: string): Promise<StorySubmission[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("story_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw toUserFacingError(error);
  return (data ?? []) as StorySubmission[];
}

export async function getCelebrityProfile(slug: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("celebrity_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw toUserFacingError(error);
  return data;
}

export async function getCollectorProfile(slug: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("collector_profiles")
    .select("*, user:users!user_id(username, full_name, avatar_url)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw toUserFacingError(error);
  return data;
}

export async function getStoriesForProfile(storyIds: string[]) {
  if (!isSupabaseConfigured || storyIds.length === 0) return [];
  const { data, error } = await supabase
    .from("stories")
    .select("id, slug, title, hero_image_url, read_time_minutes, published_at")
    .in("id", storyIds)
    .eq("status", "published");
  if (error) throw toUserFacingError(error);
  return data ?? [];
}
