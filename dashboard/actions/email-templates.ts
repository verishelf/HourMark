"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/email-templates/defaults";
import { revalidatePath } from "next/cache";

export async function ensureDefaultEmailTemplates(adminId: string) {
  const supabase = createServiceClient();
  const { error: tableError } = await supabase
    .from("email_campaign_templates")
    .select("id")
    .limit(1);

  if (tableError) {
    return { error: tableError.message };
  }

  let inserted = 0;

  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    const { data: existing } = await supabase
      .from("email_campaign_templates")
      .select("id")
      .eq("name", template.name)
      .maybeSingle();

    if (existing) continue;

    const { error } = await supabase.from("email_campaign_templates").insert({
      name: template.name,
      description: template.description,
      default_subject: template.default_subject,
      html: template.html,
      created_by: adminId,
    });

    if (error) return { error: error.message };
    inserted += 1;
  }

  if (inserted > 0) {
    revalidatePath("/campaigns");
  }

  return { success: true, inserted };
}

export async function createEmailTemplate(
  adminId: string,
  data: {
    name: string;
    description?: string;
    default_subject: string;
    html: string;
  }
) {
  if (!data.name.trim()) return { error: "Template name is required." };
  if (!data.html.trim()) return { error: "Template HTML is required." };

  const supabase = createServiceClient();
  const { data: template, error } = await supabase
    .from("email_campaign_templates")
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      default_subject: data.default_subject.trim(),
      html: data.html,
      created_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "create_email_template",
    resourceType: "email_campaign_template",
    resourceId: template.id,
  });

  revalidatePath("/campaigns");
  return { success: true, id: template.id };
}

export async function updateEmailTemplate(
  adminId: string,
  templateId: string,
  data: {
    name: string;
    description?: string;
    default_subject: string;
    html: string;
  }
) {
  if (!data.name.trim()) return { error: "Template name is required." };
  if (!data.html.trim()) return { error: "Template HTML is required." };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("email_campaign_templates")
    .update({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      default_subject: data.default_subject.trim(),
      html: data.html,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId);

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "update_email_template",
    resourceType: "email_campaign_template",
    resourceId: templateId,
  });

  revalidatePath("/campaigns");
  return { success: true };
}

export async function deleteEmailTemplate(adminId: string, templateId: string) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("email_campaign_templates")
    .select("name")
    .eq("id", templateId)
    .single();

  if (!existing) return { error: "Template not found." };

  const { error } = await supabase.from("email_campaign_templates").delete().eq("id", templateId);
  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "delete_email_template",
    resourceType: "email_campaign_template",
    resourceId: templateId,
    details: { name: existing.name },
  });

  revalidatePath("/campaigns");
  return { success: true };
}
