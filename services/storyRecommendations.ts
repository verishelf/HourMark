import { toUserFacingError } from "@/lib/supabaseErrors";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { StoryCard } from "@/types";
import { getStoriesFeed } from "@/services/stories";

let trendingCache: { stories: StoryCard[]; expires: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getTrendingStories(limit = 20): Promise<StoryCard[]> {
  if (!isSupabaseConfigured) return [];

  if (trendingCache && trendingCache.expires > Date.now()) {
    return trendingCache.stories.slice(0, limit);
  }

  const { data, error } = await supabase.rpc("get_trending_stories", {
    p_limit: limit,
    p_offset: 0,
  });
  if (error) throw toUserFacingError(error);

  const stories = ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const s = row as Record<string, unknown>;
    return {
      id: s.id as string,
      slug: s.slug as string,
      title: s.title as string,
      subtitle: (s.subtitle as string | null) ?? null,
      hero_image_url: s.hero_image_url as string,
      read_time_minutes: s.read_time_minutes as number,
      published_at: (s.published_at as string | null) ?? null,
      like_count: (s.like_count as number) ?? 0,
      bookmark_count: (s.bookmark_count as number) ?? 0,
      is_featured: Boolean(s.is_featured),
    } as StoryCard;
  });

  trendingCache = { stories, expires: Date.now() + CACHE_TTL_MS };
  return stories;
}

export async function getRecommendedStories(
  userId: string,
  limit = 20,
  offset = 0
): Promise<StoryCard[]> {
  if (!isSupabaseConfigured) return getTrendingStories(limit);

  const { data, error } = await supabase.rpc("get_recommended_stories", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw toUserFacingError(error);

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const s = row as Record<string, unknown>;
    return {
      id: s.id as string,
      slug: s.slug as string,
      title: s.title as string,
      subtitle: (s.subtitle as string | null) ?? null,
      hero_image_url: s.hero_image_url as string,
      read_time_minutes: s.read_time_minutes as number,
      published_at: (s.published_at as string | null) ?? null,
      like_count: (s.like_count as number) ?? 0,
      bookmark_count: (s.bookmark_count as number) ?? 0,
      is_featured: Boolean(s.is_featured),
    } as StoryCard;
  });
}

export async function getPersonalizedFeed(opts: {
  userId?: string;
  limit?: number;
  cursor?: { published_at: string; id: string } | null;
  categorySlug?: string | null;
}): Promise<{ stories: StoryCard[]; nextCursor: { published_at: string; id: string } | null }> {
  if (opts.categorySlug) {
    return getStoriesFeed({
      limit: opts.limit,
      cursor: opts.cursor,
      categorySlug: opts.categorySlug,
      userId: opts.userId,
    });
  }

  if (opts.userId && !opts.cursor) {
    const recommended = await getRecommendedStories(opts.userId, opts.limit ?? 20);
    if (recommended.length > 0) {
      return { stories: recommended, nextCursor: null };
    }
  }

  const trending = await getTrendingStories(opts.limit ?? 20);
  return { stories: trending, nextCursor: null };
}
