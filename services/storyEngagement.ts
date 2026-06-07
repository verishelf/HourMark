import { logAnalyticsEvent } from "@/lib/analytics";
import { toUserFacingError } from "@/lib/supabaseErrors";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { StoryComment } from "@/types";

function trackStoryEvent(name: string, params?: Record<string, string | number>) {
  void logAnalyticsEvent(name, params);
}

export async function toggleStoryLike(storyId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { data: existing } = await supabase
    .from("story_likes")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("story_likes").delete().eq("id", existing.id);
    if (error) throw toUserFacingError(error);
    return false;
  }

  const { error } = await supabase.from("story_likes").insert({ story_id: storyId, user_id: userId });
  if (error) throw toUserFacingError(error);
  trackStoryEvent("story_like", { story_id: storyId });
  return true;
}

export async function toggleStoryBookmark(storyId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { data: existing } = await supabase
    .from("story_bookmarks")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("story_bookmarks").delete().eq("id", existing.id);
    if (error) throw toUserFacingError(error);
    return false;
  }

  const { error } = await supabase.from("story_bookmarks").insert({ story_id: storyId, user_id: userId });
  if (error) throw toUserFacingError(error);
  trackStoryEvent("story_save", { story_id: storyId });
  return true;
}

export async function recordStoryShare(
  storyId: string,
  userId?: string,
  channel: "native" | "link" | "web" = "native"
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("story_shares").insert({
    story_id: storyId,
    user_id: userId ?? null,
    channel,
  });
  if (error) throw toUserFacingError(error);
  trackStoryEvent("story_share", { story_id: storyId, channel });
}

export async function recordStoryView(
  storyId: string,
  userId?: string,
  sessionId?: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from("story_views")
      .insert({
        story_id: storyId,
        user_id: userId ?? null,
        session_id: sessionId ?? null,
      })
      .select("id")
      .single();
    if (error) return null;
    trackStoryEvent("story_view", { story_id: storyId });
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function updateStoryViewProgress(
  viewId: string,
  scrollDepthPct: number
): Promise<void> {
  if (!isSupabaseConfigured || !viewId) return;
  const updates: { scroll_depth_pct: number; completed_at?: string } = {
    scroll_depth_pct: Math.min(100, Math.max(0, scrollDepthPct)),
  };
  if (scrollDepthPct >= 90) {
    updates.completed_at = new Date().toISOString();
    trackStoryEvent("story_complete", { view_id: viewId });
  }
  const { error } = await supabase.from("story_views").update(updates).eq("id", viewId);
  if (error) return;
}

export async function getStoryComments(storyId: string): Promise<StoryComment[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("story_comments")
    .select("*, user:users!user_id(username, full_name, avatar_url)")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });
  if (error) throw toUserFacingError(error);
  return (data ?? []) as StoryComment[];
}

export async function addStoryComment(
  storyId: string,
  userId: string,
  body: string
): Promise<StoryComment> {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("story_comments")
    .insert({ story_id: storyId, user_id: userId, body })
    .select("*, user:users!user_id(username, full_name, avatar_url)")
    .single();
  if (error) throw toUserFacingError(error);
  return data as StoryComment;
}
