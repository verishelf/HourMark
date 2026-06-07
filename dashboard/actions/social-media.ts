"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { publishToSocialPlatforms } from "@/lib/social-publish";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type {
  SocialPlatform,
  SocialPostStatus,
  SocialPlatformResult,
  SocialChannelCredentials,
  SocialPost,
} from "@/types/social-media";

const MAX_BYTES = 5 * 1024 * 1024;

function derivePostStatus(
  results: Partial<Record<SocialPlatform, SocialPlatformResult>>
): SocialPostStatus {
  const values = Object.values(results);
  if (values.length === 0) return "failed";
  const successes = values.filter((r) => r.success).length;
  if (successes === values.length) return "published";
  if (successes === 0) return "failed";
  return "partial";
}

export async function getSocialChannelCredentials(): Promise<SocialChannelCredentials[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("social_channel_credentials")
    .select("*")
    .order("platform");
  return (data ?? []) as SocialChannelCredentials[];
}

export async function saveSocialChannelCredentials(
  adminId: string,
  platform: SocialPlatform,
  data: { label?: string; credentials: Record<string, string>; enabled: boolean }
) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("social_channel_credentials").upsert(
    {
      platform,
      label: data.label ?? null,
      credentials: data.credentials,
      enabled: data.enabled,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "platform" }
  );

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "update_social_credentials",
    resourceType: "social_channel_credentials",
    resourceId: platform,
    details: { platform, enabled: data.enabled },
  });

  revalidatePath("/settings");
  revalidatePath("/social-media");
  return { success: true };
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false });
  return ((data ?? []) as SocialPost[]).map(normalizePost);
}

function normalizePost(row: SocialPost): SocialPost {
  return {
    ...row,
    media_urls: Array.isArray(row.media_urls) ? row.media_urls : [],
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    platform_results: row.platform_results ?? {},
  };
}

export async function createSocialPost(
  adminId: string,
  data: {
    content: string;
    media_urls?: string[];
    platforms: SocialPlatform[];
    scheduled_at?: string | null;
  }
) {
  if (!data.content.trim()) return { error: "Content is required" };
  if (data.platforms.length === 0) return { error: "Select at least one platform" };

  const supabase = createServiceClient();
  const status = data.scheduled_at ? "scheduled" : "draft";

  const { data: post, error } = await supabase
    .from("social_posts")
    .insert({
      content: data.content.trim(),
      media_urls: data.media_urls ?? [],
      platforms: data.platforms,
      scheduled_at: data.scheduled_at ?? null,
      status,
      created_by: adminId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "create_social_post",
    resourceType: "social_post",
    resourceId: post.id,
  });

  revalidatePath("/social-media");
  return { success: true, id: post.id };
}

export async function updateSocialPost(
  adminId: string,
  postId: string,
  data: {
    content?: string;
    media_urls?: string[];
    platforms?: SocialPlatform[];
    scheduled_at?: string | null;
  }
) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("social_posts")
    .select("status")
    .eq("id", postId)
    .single();

  if (!existing) return { error: "Post not found" };
  if (!["draft", "scheduled"].includes(existing.status)) {
    return { error: "Only draft or scheduled posts can be edited" };
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.content !== undefined) updates.content = data.content.trim();
  if (data.media_urls !== undefined) updates.media_urls = data.media_urls;
  if (data.platforms !== undefined) updates.platforms = data.platforms;
  if (data.scheduled_at !== undefined) {
    updates.scheduled_at = data.scheduled_at;
    updates.status = data.scheduled_at ? "scheduled" : "draft";
  }

  const { error } = await supabase.from("social_posts").update(updates).eq("id", postId);
  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "update_social_post",
    resourceType: "social_post",
    resourceId: postId,
  });

  revalidatePath("/social-media");
  return { success: true };
}

export async function deleteSocialPost(adminId: string, postId: string) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("social_posts")
    .select("status")
    .eq("id", postId)
    .single();

  if (!existing) return { error: "Post not found" };
  if (existing.status === "publishing") return { error: "Post is currently publishing" };

  const { error } = await supabase.from("social_posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "delete_social_post",
    resourceType: "social_post",
    resourceId: postId,
  });

  revalidatePath("/social-media");
  return { success: true };
}

export async function publishSocialPost(adminId: string, postId: string) {
  const supabase = createServiceClient();

  const { data: post } = await supabase.from("social_posts").select("*").eq("id", postId).single();
  if (!post) return { error: "Post not found" };
  if (!["draft", "scheduled", "failed", "partial"].includes(post.status)) {
    return { error: "Post cannot be published in its current status" };
  }

  const { data: credRows } = await supabase
    .from("social_channel_credentials")
    .select("platform, credentials, enabled")
    .in("platform", post.platforms)
    .eq("enabled", true);

  const credentialsByPlatform: Partial<Record<SocialPlatform, Record<string, string>>> = {};
  for (const row of credRows ?? []) {
    credentialsByPlatform[row.platform as SocialPlatform] = row.credentials as Record<string, string>;
  }

  await supabase
    .from("social_posts")
    .update({ status: "publishing", updated_at: new Date().toISOString() })
    .eq("id", postId);

  const results = await publishToSocialPlatforms(
    post.platforms as SocialPlatform[],
    post.content,
    (post.media_urls as string[]) ?? [],
    credentialsByPlatform
  );

  const status = derivePostStatus(results);
  const publishedAt = Object.values(results).some((r) => r.success) ? new Date().toISOString() : null;

  await supabase
    .from("social_posts")
    .update({
      status,
      platform_results: results,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  await logAdminAction({
    adminId,
    action: "publish_social_post",
    resourceType: "social_post",
    resourceId: postId,
    details: { status, results },
  });

  revalidatePath("/social-media");

  const successCount = Object.values(results).filter((r) => r.success).length;
  const total = Object.keys(results).length;

  return {
    success: successCount > 0,
    status,
    successCount,
    total,
    results,
    error: successCount === 0 ? "Failed on all platforms — check credentials in Settings" : undefined,
  };
}

export async function publishDueSocialPosts(adminId: string) {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data: due } = await supabase
    .from("social_posts")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  let published = 0;
  for (const row of due ?? []) {
    const result = await publishSocialPost(adminId, row.id);
    if (result.successCount && result.successCount > 0) published += 1;
  }

  return { published, total: due?.length ?? 0 };
}

export async function uploadSocialMediaImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file provided" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };
  if (file.size > MAX_BYTES) return { error: "Image must be under 5MB" };

  const supabase = createServiceClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `posts/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("social-media").upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from("social-media").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function getConnectedPlatformStats() {
  const creds = await getSocialChannelCredentials();
  const enabled = creds.filter((c) => c.enabled);
  return {
    totalPlatforms: 8,
    connected: enabled.length,
    configured: creds.length,
  };
}
