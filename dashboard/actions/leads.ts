"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { sendEmail } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@/types/database";

export async function updateLeadStatus(adminId: string, leadId: string, status: LeadStatus) {
  const supabase = createServiceClient();
  await supabase
    .from("seller_leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  await logAdminAction({
    adminId,
    action: "update_lead_status",
    resourceType: "seller_lead",
    resourceId: leadId,
    details: { status },
  });
  revalidatePath("/leads");
  return { success: true };
}

export async function addLeadNotes(adminId: string, leadId: string, notes: string) {
  const supabase = createServiceClient();
  await supabase
    .from("seller_leads")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  await logAdminAction({
    adminId,
    action: "add_lead_notes",
    resourceType: "seller_lead",
    resourceId: leadId,
  });
  revalidatePath("/leads");
  return { success: true };
}

export async function assignLead(adminId: string, leadId: string, assigneeId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("seller_leads")
    .update({ assigned_to: assigneeId, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  await logAdminAction({
    adminId,
    action: "assign_lead",
    resourceType: "seller_lead",
    resourceId: leadId,
    details: { assigneeId },
  });
  revalidatePath("/leads");
  return { success: true };
}

export async function sendLeadEmail(adminId: string, email: string, subject: string, body: string) {
  const result = await sendEmail({
    to: email,
    subject,
    html: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-weight: 300; letter-spacing: 2px;">Crownly</h1>
      <div style="margin-top: 24px; line-height: 1.6;">${body}</div>
    </div>`,
    tags: [{ name: "category", value: "seller_lead" }],
  });

  if (!result.ok) return { error: result.error };

  await logAdminAction({
    adminId,
    action: "send_lead_email",
    resourceType: "seller_lead",
    details: { email, subject, messageId: result.id },
  });
  return { success: true, id: result.id };
}

export async function createLead(data: {
  name: string;
  email: string;
  phone?: string;
  watch_brand: string;
  model: string;
  estimated_value?: number;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("seller_leads").insert({
    ...data,
    status: "new",
  });
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { success: true };
}
