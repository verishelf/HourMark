import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  if (!publicClient) {
    publicClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return publicClient;
}

export async function getPublishedStories(limit = 20) {
  const supabase = getSupabasePublic();
  if (!supabase) return [];

  const { data } = await supabase
    .from("stories")
    .select("id, slug, title, subtitle, hero_image_url, read_time_minutes, published_at, category:story_categories(name, slug), author:authors(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getPublishedStory(slug: string) {
  const supabase = getSupabasePublic();
  if (!supabase) return null;

  const { data } = await supabase
    .from("stories")
    .select("*, category:story_categories(name, slug), author:authors(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data;
}

export async function getPublishedStorySlugs() {
  const supabase = getSupabasePublic();
  if (!supabase) return [];

  const { data } = await supabase
    .from("stories")
    .select("slug, updated_at")
    .eq("status", "published");

  return data ?? [];
}

export async function getPublishedProfile(slug: string) {
  const supabase = getSupabasePublic();
  if (!supabase) return null;

  const { data: celeb } = await supabase
    .from("celebrity_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (celeb) return { type: "celebrity" as const, profile: celeb };

  const { data: collector } = await supabase
    .from("collector_profiles")
    .select("*, user:users!user_id(username, full_name, avatar_url)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (collector) return { type: "collector" as const, profile: collector };
  return null;
}
