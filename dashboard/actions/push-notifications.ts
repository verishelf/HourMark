"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { sendExpoPushToTokens } from "@/lib/expo-push";
import { revalidatePath } from "next/cache";
import type { PushNotificationAudience } from "@/types/database";

type TokenRow = { token: string; user_id: string };

async function getAudienceUserIds(audience: PushNotificationAudience): Promise<string[]> {
  const supabase = createServiceClient();

  if (audience === "sellers") {
    const { data } = await supabase.from("users").select("id").eq("is_verified_seller", true);
    return (data ?? []).map((u) => u.id);
  }

  if (audience === "dealers") {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("is_verified_seller", true)
      .eq("stripe_onboarding_status", "complete");
    return (data ?? []).map((u) => u.id);
  }

  if (audience === "buyers") {
    const { data: orders } = await supabase.from("orders").select("buyer_id");
    return [...new Set((orders ?? []).map((o) => o.buyer_id))];
  }

  if (audience === "new_leads") {
    const { data: leads } = await supabase.from("seller_leads").select("email").eq("status", "new");
    const emails = [...new Set((leads ?? []).map((l) => l.email?.trim().toLowerCase()).filter(Boolean))];
    if (emails.length === 0) return [];
    const { data: users } = await supabase.from("users").select("id");
    return (users ?? []).map((u) => u.id);
  }

  if (audience === "web_signups") {
    return [];
  }

  const { data } = await supabase.from("push_tokens").select("user_id");
  return [...new Set((data ?? []).map((t) => t.user_id))];
}

async function getAudiencePushTokens(audience: PushNotificationAudience): Promise<TokenRow[]> {
  const supabase = createServiceClient();

  if (audience === "all") {
    const { data } = await supabase.from("push_tokens").select("token, user_id");
    return dedupeTokens(data ?? []);
  }

  const userIds = await getAudienceUserIds(audience);
  if (userIds.length === 0) return [];

  const { data } = await supabase
    .from("push_tokens")
    .select("token, user_id")
    .in("user_id", userIds);

  return dedupeTokens(data ?? []);
}

function dedupeTokens(rows: TokenRow[]): TokenRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.token)) return false;
    seen.add(row.token);
    return true;
  });
}

export async function createPushNotificationCampaign(
  adminId: string,
  data: {
    title: string;
    body: string;
    audience: PushNotificationAudience;
    deep_link?: string | null;
    scheduled_at?: string | null;
  }
) {
  const supabase = createServiceClient();
  const { data: campaign, error } = await supabase
    .from("push_notification_campaigns")
    .insert({
      title: data.title,
      body: data.body,
      audience: data.audience,
      deep_link: data.deep_link ?? null,
      scheduled_at: data.scheduled_at ?? null,
      status: data.scheduled_at ? "scheduled" : "draft",
      created_by: adminId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "create_push_campaign",
    resourceType: "push_notification_campaign",
    resourceId: campaign.id,
  });

  revalidatePath("/push-notifications");
  return { success: true, id: campaign.id };
}

export async function deletePushNotificationCampaign(adminId: string, campaignId: string) {
  const supabase = createServiceClient();
  const { data: campaign } = await supabase
    .from("push_notification_campaigns")
    .select("status")
    .eq("id", campaignId)
    .single();

  if (campaign?.status === "sending") {
    return { error: "Cannot delete a campaign that is sending" };
  }

  const { error } = await supabase.from("push_notification_campaigns").delete().eq("id", campaignId);
  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "delete_push_campaign",
    resourceType: "push_notification_campaign",
    resourceId: campaignId,
  });

  revalidatePath("/push-notifications");
  return { success: true };
}

export async function sendPushNotificationCampaign(adminId: string, campaignId: string) {
  const supabase = createServiceClient();

  const { data: campaign, error: fetchError } = await supabase
    .from("push_notification_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (fetchError || !campaign) return { error: "Campaign not found" };
  if (campaign.status === "sent" || campaign.status === "sending") {
    return { error: "Campaign already sent or in progress" };
  }

  await supabase
    .from("push_notification_campaigns")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  const tokens = await getAudiencePushTokens(campaign.audience as PushNotificationAudience);
  const pushData: Record<string, unknown> = {
    type: "admin_push",
    campaign_id: campaignId,
  };
  if (campaign.deep_link) {
    pushData.url = campaign.deep_link.startsWith("/") ? campaign.deep_link : `/${campaign.deep_link}`;
  }

  const uniqueUserIds = [...new Set(tokens.map((t) => t.user_id))];

  const pushResult = await sendExpoPushToTokens(
    tokens.map((t) => t.token),
    { title: campaign.title, body: campaign.body, data: pushData }
  );

  if (uniqueUserIds.length > 0) {
    const notificationRows = uniqueUserIds.map((userId) => ({
      user_id: userId,
      type: "admin_push",
      title: campaign.title,
      body: campaign.body,
      data: pushData,
    }));

    for (let i = 0; i < notificationRows.length; i += 100) {
      await supabase.from("notifications").insert(notificationRows.slice(i, i + 100));
    }
  }

  await supabase
    .from("push_notification_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      recipient_count: tokens.length,
      success_count: pushResult.successCount,
      failure_count: pushResult.failureCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  await logAdminAction({
    adminId,
    action: "send_push_campaign",
    resourceType: "push_notification_campaign",
    resourceId: campaignId,
    details: {
      recipient_count: tokens.length,
      success_count: pushResult.successCount,
      failure_count: pushResult.failureCount,
    },
  });

  revalidatePath("/push-notifications");

  if (tokens.length === 0) {
    return { success: true, warning: "No registered push tokens for this audience" };
  }

  if (pushResult.failureCount > 0 && pushResult.successCount === 0) {
    return { error: pushResult.errors[0] ?? "All push deliveries failed" };
  }

  return {
    success: true,
    recipientCount: tokens.length,
    successCount: pushResult.successCount,
    failureCount: pushResult.failureCount,
  };
}

export async function sendTestPushNotification(
  adminId: string,
  data: { title: string; body: string; deep_link?: string | null }
) {
  const supabase = createServiceClient();
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", adminId)
    .limit(5);

  if (!tokens?.length) {
    return { error: "No push token registered for your account. Open the Crownly app on a physical device and allow notifications." };
  }

  const pushData: Record<string, unknown> = { type: "admin_push", test: true };
  if (data.deep_link) {
    pushData.url = data.deep_link.startsWith("/") ? data.deep_link : `/${data.deep_link}`;
  }

  const result = await sendExpoPushToTokens(
    tokens.map((t) => t.token),
    { title: data.title, body: data.body, data: pushData }
  );

  if (result.successCount === 0) {
    return { error: result.errors[0] ?? "Test push failed" };
  }

  return { success: true };
}

export async function getPushTokenStats() {
  const supabase = createServiceClient();
  const { count: totalTokens } = await supabase
    .from("push_tokens")
    .select("id", { count: "exact", head: true });

  const { data: platforms } = await supabase.from("push_tokens").select("platform");
  const ios = (platforms ?? []).filter((p) => p.platform === "ios").length;
  const android = (platforms ?? []).filter((p) => p.platform === "android").length;

  return { totalTokens: totalTokens ?? 0, ios, android };
}
