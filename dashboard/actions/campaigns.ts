"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { sendEmail } from "@/lib/resend";
import { getAllAuthEmails, getAuthEmailsByUserIds } from "@/lib/userEmails";
import { revalidatePath } from "next/cache";
import type { CampaignAudience } from "@/types/database";

async function getAudienceEmails(audience: CampaignAudience): Promise<string[]> {
  const supabase = createServiceClient();

  if (audience === "new_leads") {
    const { data } = await supabase.from("seller_leads").select("email").eq("status", "new");
    return [...new Set((data ?? []).map((l) => l.email?.trim()).filter(Boolean))] as string[];
  }

  if (audience === "sellers") {
    const { data } = await supabase.from("users").select("id").eq("is_verified_seller", true);
    return getAuthEmailsByUserIds((data ?? []).map((u) => u.id));
  }

  if (audience === "dealers") {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("is_verified_seller", true)
      .eq("stripe_onboarding_status", "complete");
    return getAuthEmailsByUserIds((data ?? []).map((u) => u.id));
  }

  if (audience === "buyers") {
    const { data: orders } = await supabase.from("orders").select("buyer_id");
    const buyerIds = [...new Set((orders ?? []).map((o) => o.buyer_id))];
    return getAuthEmailsByUserIds(buyerIds);
  }

  return getAllAuthEmails();
}

export async function createCampaign(
  adminId: string,
  data: {
    subject: string;
    template_html: string;
    audience: CampaignAudience;
    scheduled_at?: string | null;
    template_id?: string | null;
  }
) {
  const supabase = createServiceClient();
  const { data: campaign, error } = await supabase
    .from("email_campaigns")
    .insert({
      subject: data.subject,
      template_html: data.template_html,
      audience: data.audience,
      scheduled_at: data.scheduled_at ?? null,
      template_id: data.template_id ?? null,
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

export async function updateCampaign(
  adminId: string,
  campaignId: string,
  data: {
    subject: string;
    template_html: string;
    audience: CampaignAudience;
    scheduled_at?: string | null;
    template_id?: string | null;
  }
) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("email_campaigns")
    .select("status")
    .eq("id", campaignId)
    .single();

  if (!existing) return { error: "Campaign not found" };
  if (existing.status === "sending" || existing.status === "sent") {
    return { error: "Sent campaigns cannot be edited." };
  }

  const { error } = await supabase
    .from("email_campaigns")
    .update({
      subject: data.subject,
      template_html: data.template_html,
      audience: data.audience,
      scheduled_at: data.scheduled_at ?? null,
      template_id: data.template_id ?? null,
      status: data.scheduled_at ? "scheduled" : "draft",
    })
    .eq("id", campaignId);

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "update_campaign",
    resourceType: "email_campaign",
    resourceId: campaignId,
  });

  revalidatePath("/campaigns");
  return { success: true };
}

export async function deleteCampaign(adminId: string, campaignId: string) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("email_campaigns")
    .select("status, subject")
    .eq("id", campaignId)
    .single();

  if (!existing) return { error: "Campaign not found" };
  if (existing.status === "sending") {
    return { error: "Campaign is currently sending and cannot be deleted." };
  }

  const { error } = await supabase.from("email_campaigns").delete().eq("id", campaignId);
  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "delete_campaign",
    resourceType: "email_campaign",
    resourceId: campaignId,
    details: { subject: existing.subject, status: existing.status },
  });

  revalidatePath("/campaigns");
  return { success: true };
}

export async function sendTestEmail(adminId: string, to: string, subject: string, html: string) {
  const result = await sendEmail({ to, subject: `[TEST] ${subject}`, html });
  if (!result.ok) return { error: result.error };

  await logAdminAction({
    adminId,
    action: "send_test_email",
    resourceType: "email_campaign",
    details: { to, messageId: result.id },
  });
  return { success: true, id: result.id };
}

export async function sendCampaign(adminId: string, campaignId: string) {
  const supabase = createServiceClient();
  const { data: campaign } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) return { error: "Campaign not found" };

  const emails = await getAudienceEmails(campaign.audience);
  if (emails.length === 0) {
    return {
      error:
        "No deliverable email addresses found for this audience. User accounts may use Apple Hide My Email, or the audience list may be empty.",
    };
  }

  await supabase.from("email_campaigns").update({ status: "sending" }).eq("id", campaignId);

  const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/track/open?campaign=${campaignId}" width="1" height="1" />`;
  let sent = 0;
  const failures: string[] = [];

  for (const email of emails.slice(0, 100)) {
    const result = await sendEmail({
      to: email,
      subject: campaign.subject,
      html: campaign.template_html + trackingPixel,
      tags: [
        { name: "campaign_id", value: campaignId },
        { name: "category", value: "campaign" },
      ],
    });

    if (result.ok) {
      sent += 1;
    } else {
      failures.push(`${email}: ${result.error}`);
    }
  }

  if (sent === 0) {
    await supabase.from("email_campaigns").update({ status: "draft" }).eq("id", campaignId);
    return { error: failures[0] ?? "All campaign emails failed to send." };
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
    details: { recipientCount: emails.length, sent, failures: failures.slice(0, 5) },
  });

  revalidatePath("/campaigns");
  return {
    success: true,
    sent,
    failed: failures.length,
    error: failures.length > 0 ? `${failures.length} recipient(s) failed.` : undefined,
  };
}
