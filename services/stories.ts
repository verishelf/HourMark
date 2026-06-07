import { shouldFallbackToMock, toUserFacingError } from "@/lib/supabaseErrors";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Story, StoryCard, StoryCategory, StoryBlock } from "@/types";

const STORY_SELECT = `
  id, slug, title, subtitle, hero_image_url, read_time_minutes,
  published_at, like_count, bookmark_count, is_featured, view_count,
  category:story_categories(slug, name),
  author:authors(name, avatar_url)
`;

const STORY_DETAIL_SELECT = `
  *,
  category:story_categories(*),
  author:authors(*)
`;

function mapStoryCard(
  row: Record<string, unknown>,
  liked?: boolean,
  bookmarked?: boolean
): StoryCard {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    subtitle: (row.subtitle as string | null) ?? null,
    hero_image_url: row.hero_image_url as string,
    read_time_minutes: row.read_time_minutes as number,
    published_at: (row.published_at as string | null) ?? null,
    like_count: (row.like_count as number) ?? 0,
    bookmark_count: (row.bookmark_count as number) ?? 0,
    is_featured: Boolean(row.is_featured),
    category: row.category as StoryCard["category"],
    author: row.author as StoryCard["author"],
    liked_by_me: liked,
    bookmarked_by_me: bookmarked,
  };
}

export async function getStoryCategories(): Promise<StoryCategory[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("story_categories")
    .select("*")
    .order("sort_order");
  if (error) throw toUserFacingError(error);
  return (data ?? []) as StoryCategory[];
}

export async function getFeaturedStories(limit = 5): Promise<StoryCard[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw toUserFacingError(error);
  return (data ?? []).map((row) => mapStoryCard(row as Record<string, unknown>));
}

export async function getStoriesFeed(opts: {
  limit?: number;
  cursor?: { published_at: string; id: string } | null;
  categorySlug?: string | null;
  userId?: string;
}): Promise<{ stories: StoryCard[]; nextCursor: { published_at: string; id: string } | null }> {
  const limit = opts.limit ?? 20;
  if (!isSupabaseConfigured) return { stories: [], nextCursor: null };

  let query = supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts.categorySlug) {
    const { data: cat } = await supabase
      .from("story_categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (opts.cursor) {
    query = query.or(
      `published_at.lt.${opts.cursor.published_at},and(published_at.eq.${opts.cursor.published_at},id.lt.${opts.cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) throw toUserFacingError(error);

  const rows = (data ?? []) as Record<string, unknown>[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  let likedIds = new Set<string>();
  let bookmarkedIds = new Set<string>();
  if (opts.userId && page.length > 0) {
    const ids = page.map((r) => r.id as string);
    const [likesRes, bookmarksRes] = await Promise.all([
      supabase.from("story_likes").select("story_id").eq("user_id", opts.userId).in("story_id", ids),
      supabase.from("story_bookmarks").select("story_id").eq("user_id", opts.userId).in("story_id", ids),
    ]);
    likedIds = new Set((likesRes.data ?? []).map((l) => l.story_id));
    bookmarkedIds = new Set((bookmarksRes.data ?? []).map((b) => b.story_id));
  }

  const stories = page.map((row) =>
    mapStoryCard(row, likedIds.has(row.id as string), bookmarkedIds.has(row.id as string))
  );

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? { published_at: last.published_at as string, id: last.id as string }
      : null;

  return { stories, nextCursor };
}

export async function getStoryBySlug(
  slug: string,
  userId?: string
): Promise<(Story & { liked_by_me?: boolean; bookmarked_by_me?: boolean }) | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("stories")
    .select(STORY_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    if (shouldFallbackToMock(error)) return null;
    throw toUserFacingError(error);
  }
  if (!data) return null;

  const story = {
    ...(data as Story),
    body: (data.body ?? []) as StoryBlock[],
  };

  if (userId) {
    const [likeRes, bookmarkRes] = await Promise.all([
      supabase.from("story_likes").select("id").eq("story_id", story.id).eq("user_id", userId).maybeSingle(),
      supabase.from("story_bookmarks").select("id").eq("story_id", story.id).eq("user_id", userId).maybeSingle(),
    ]);
    return { ...story, liked_by_me: Boolean(likeRes.data), bookmarked_by_me: Boolean(bookmarkRes.data) };
  }

  return story;
}

export async function getRelatedStories(
  storyId: string,
  categoryId: string,
  limit = 4
): Promise<StoryCard[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", storyId)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw toUserFacingError(error);
  return (data ?? []).map((row) => mapStoryCard(row as Record<string, unknown>));
}

export async function getBookmarkedStories(userId: string): Promise<StoryCard[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("story_bookmarks")
    .select(`created_at, story:stories(${STORY_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw toUserFacingError(error);

  return (data ?? [])
    .map((row) => {
      const story = row.story as Record<string, unknown> | null;
      if (!story) return null;
      return mapStoryCard(story, undefined, true);
    })
    .filter(Boolean) as StoryCard[];
}

export async function getListingsForStory(listingIds: string[]) {
  if (!isSupabaseConfigured || listingIds.length === 0) return [];
  const { data, error } = await supabase
    .from("listings")
    .select("id, brand, model, price, images, status")
    .in("id", listingIds)
    .eq("status", "active");
  if (error) throw toUserFacingError(error);
  return data ?? [];
}
