"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { sendEmail, FROM_EMAIL } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import type { CampaignAudience } from "@/types/database";

async function getAudienceEmails(audience: CampaignAudience): Promise<string[]> {
  const supabase = createServiceClient();

  if (audience === "new_leads") {
    const { data } = await supabase.from("seller_leads").select("email").eq("status", "new");
    return (data ?? []).map((l) => l.email).filter(Boolean);
  }

  if (audience === "sellers") {
    const { data } = await supabase.from("users").select("username").eq("is_verified_seller", true);
    return (data ?? []).map((u) => u.username).filter((e): e is string => !!e && e.includes("@"));
  }

  if (audience === "buyers") {
    const { data: orders } = await supabase.from("orders").select("buyer_id");
    const buyerIds = [...new Set((orders ?? []).map((o) => o.buyer_id))];
    if (buyerIds.length === 0) return [];
    const { data } = await supabase.from("users").select("username").in("id", buyerIds);
    return (data ?? []).map((u) => u.username).filter((e): e is string => !!e && e.includes("@"));
  }

  const { data } = await supabase.from("users").select("username");
  return (data ?? []).map((u) => u.username).filter((e): e is string => !!e && e.includes("@"));
}

export async function createCampaign(
  adminId: string,
  data: {
    subject: string;
    template_html: string;
    audience: CampaignAudience;
    scheduled_at?: string | null;
  }
) {
  const supabase = createServiceClient();
  const { data: campaign, error } = await supabase
    .from("email_campaigns")
    .insert({
      ...data,
      status: data.scheduled_at ? "scheduled" : "draft",
      created_by: adminId,
      open_count: 0,
      click_count: 0,
      reply_count: 0,
      audience_filters: {},
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "create_campaign",
    resourceType: "email_campaign",
    resourceId: campaign.id,
  });

  revalidatePath("/campaigns");
  return { success: true, id: campaign.id };
}

export async function sendTestEmail(adminId: string, to: string, subject: string, html: string) {
  const result = await sendEmail({ to, subject: `[TEST] ${subject}`, html });
  await logAdminAction({
    adminId,
    action: "send_test_email",
    resourceType: "email_campaign",
    details: { to },
  });
  return { success: !result.error };
}

export async function sendCampaign(adminId: string, campaignId: string) {
  const supabase = createServiceClient();
  const { data: campaign } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) return { error: "Campaign not found" };

  await supabase.from("email_campaigns").update({ status: "sending" }).eq("id", campaignId);

  const emails = await getAudienceEmails(campaign.audience);
  const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/track/open?campaign=${campaignId}" width="1" height="1" />`;

  for (const email of emails.slice(0, 100)) {
    await sendEmail({
      to: email,
      subject: campaign.subject,
      html: campaign.template_html + trackingPixel,
      tags: [
        { name: "campaign_id", value: campaignId },
        { name: "category", value: "campaign" },
      ],
    });
  }

  await supabase
    .from("email_campaigns")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", campaignId);

  await logAdminAction({
    adminId,
    action: "send_campaign",
    resourceType: "email_campaign",
    resourceId: campaignId,
    details: { recipientCount: emails.length },
  });

  revalidatePath("/campaigns");
  return { success: true, sent: emails.length };
}
