"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { StoryBlock, StoryStatus } from "@/types/database";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function createStory(
  adminId: string,
  data: {
    title: string;
    subtitle?: string;
    hero_image_url: string;
    body: StoryBlock[];
    category_id: string;
    author_id?: string;
    read_time_minutes?: number;
    source_attribution?: string;
    related_listing_ids?: string[];
    scheduled_at?: string | null;
    is_featured?: boolean;
    submitted_by?: string;
  }
) {
  const supabase = createServiceClient();
  let slug = slugify(data.title);
  const { data: existing } = await supabase.from("stories").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Date.now()}`;

  const status: StoryStatus = data.scheduled_at ? "scheduled" : "draft";

  const { data: story, error } = await supabase
    .from("stories")
    .insert({
      slug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      hero_image_url: data.hero_image_url,
      body: data.body,
      category_id: data.category_id,
      author_id: data.author_id ?? null,
      read_time_minutes: data.read_time_minutes ?? 5,
      source_attribution: data.source_attribution ?? null,
      related_listing_ids: data.related_listing_ids ?? [],
      scheduled_at: data.scheduled_at ?? null,
      is_featured: data.is_featured ?? false,
      status,
      submitted_by: data.submitted_by ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "create_story",
    resourceType: "story",
    resourceId: story.id,
    details: { title: data.title },
  });

  revalidatePath("/stories");
  return { success: true, id: story.id };
}

export async function updateStory(
  adminId: string,
  storyId: string,
  data: Partial<{
    title: string;
    subtitle: string | null;
    hero_image_url: string;
    body: StoryBlock[];
    category_id: string;
    author_id: string | null;
    read_time_minutes: number;
    source_attribution: string | null;
    related_listing_ids: string[];
    scheduled_at: string | null;
    is_featured: boolean;
    status: StoryStatus;
    published_at: string | null;
  }>
) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("stories").update({ ...data, updated_at: new Date().toISOString() }).eq("id", storyId);
  if (error) return { error: error.message };

  await logAdminAction({ adminId, action: "update_story", resourceType: "story", resourceId: storyId, details: data });
  revalidatePath("/stories");
  revalidatePath(`/stories/${storyId}/edit`);
  return { success: true };
}

export async function publishStory(adminId: string, storyId: string) {
  return updateStory(adminId, storyId, {
    status: "published",
    published_at: new Date().toISOString(),
  });
}

export async function scheduleStory(adminId: string, storyId: string, scheduledAt: string) {
  return updateStory(adminId, storyId, { status: "scheduled", scheduled_at: scheduledAt });
}

export async function featureStory(adminId: string, storyId: string, featured: boolean) {
  const result = await updateStory(adminId, storyId, { is_featured: featured });
  if (result.success) {
    await logAdminAction({
      adminId,
      action: featured ? "feature_story" : "unfeature_story",
      resourceType: "story",
      resourceId: storyId,
    });
  }
  return result;
}

export async function deleteStory(adminId: string, storyId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("stories").delete().eq("id", storyId);
  if (error) return { error: error.message };

  await logAdminAction({ adminId, action: "delete_story", resourceType: "story", resourceId: storyId });
  revalidatePath("/stories");
  return { success: true };
}

export async function reviewSubmission(
  adminId: string,
  submissionId: string,
  decision: "approved" | "rejected",
  reviewerNotes?: string,
  categoryId?: string
) {
  const supabase = createServiceClient();

  const { data: submission, error: fetchError } = await supabase
    .from("story_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) return { error: "Submission not found" };

  if (decision === "rejected") {
    await supabase
      .from("story_submissions")
      .update({
        status: "rejected",
        reviewer_notes: reviewerNotes ?? null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    await logAdminAction({ adminId, action: "reject_submission", resourceType: "story_submission", resourceId: submissionId });
    revalidatePath("/stories/submissions");
    return { success: true };
  }

  const dealRoom = await supabase.from("story_categories").select("id").eq("slug", "collector-spotlights").single();
  const catId = categoryId ?? dealRoom.data?.id;
  if (!catId) return { error: "Category required" };

  const hero = submission.photo_urls?.[0] ?? "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200";
  const body: StoryBlock[] = [
    { type: "paragraph", text: submission.content },
  ];
  if (submission.business_lesson) {
    body.push({ type: "heading", text: "Business Lesson", level: 2 });
    body.push({ type: "paragraph", text: submission.business_lesson });
  }
  if (submission.networking_lesson) {
    body.push({ type: "heading", text: "Networking Lesson", level: 2 });
    body.push({ type: "paragraph", text: submission.networking_lesson });
  }

  const createResult = await createStory(adminId, {
    title: submission.title,
    hero_image_url: hero,
    body,
    category_id: catId,
    read_time_minutes: Math.max(3, Math.ceil(submission.content.length / 1000)),
    submitted_by: submission.user_id,
  });

  if ("error" in createResult && createResult.error) return { error: createResult.error };

  const storyId = createResult.id!;
  await publishStory(adminId, storyId);

  await supabase
    .from("story_submissions")
    .update({
      status: "approved",
      reviewer_notes: reviewerNotes ?? null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      story_id: storyId,
    })
    .eq("id", submissionId);

  await logAdminAction({ adminId, action: "approve_submission", resourceType: "story_submission", resourceId: submissionId, details: { storyId } });
  revalidatePath("/stories/submissions");
  return { success: true, storyId };
}

export async function createCelebrityProfile(
  adminId: string,
  data: {
    name: string;
    bio?: string;
    avatar_url?: string;
    watch_collection?: unknown[];
    business_ventures?: unknown[];
    career_highlights?: unknown[];
    networking_lessons?: string;
    favorite_quote?: string;
    source_urls: string[];
  }
) {
  const supabase = createServiceClient();
  const slug = slugify(data.name);

  const { data: profile, error } = await supabase
    .from("celebrity_profiles")
    .insert({ ...data, slug, published: true })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAdminAction({ adminId, action: "create_celebrity_profile", resourceType: "celebrity_profile", resourceId: profile.id });
  revalidatePath("/stories/profiles");
  return { success: true, id: profile.id };
}

export async function createAuthor(adminId: string, data: { name: string; bio?: string; title?: string; avatar_url?: string }) {
  const supabase = createServiceClient();
  const { data: author, error } = await supabase.from("authors").insert(data).select("id").single();
  if (error) return { error: error.message };
  await logAdminAction({ adminId, action: "create_author", resourceType: "author", resourceId: author.id });
  return { success: true, id: author.id };
}

export async function getStoryAnalytics() {
  const supabase = createServiceClient();

  const [viewsRes, completedRes, storiesRes] = await Promise.all([
    supabase.from("story_views").select("id", { count: "exact", head: true }),
    supabase.from("story_views").select("id", { count: "exact", head: true }).not("completed_at", "is", null),
    supabase
      .from("stories")
      .select("slug, title, view_count, like_count, bookmark_count, share_count")
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(10),
  ]);

  const totalViews = viewsRes.count ?? 0;
  const totalReads = completedRes.count ?? 0;

  const trending = (storiesRes.data ?? []).map((s) => ({
    slug: s.slug,
    title: s.title,
    view_count: s.view_count,
    engagement_score: s.view_count + s.like_count * 3 + s.bookmark_count * 2 + s.share_count * 4,
  }));

  return {
    total_views: totalViews,
    total_reads: totalReads,
    completion_rate: totalViews > 0 ? Math.round((totalReads / totalViews) * 100) : 0,
    total_shares: 0,
    total_saves: 0,
    total_likes: 0,
    trending,
  };
}
