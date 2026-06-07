"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updatePlatformSettings(
  adminId: string,
  settings: {
    commission_percentage?: number;
    seller_fee_percentage?: number;
    buyer_fee_percentage?: number;
    email_templates?: Record<string, string>;
    authentication_rules?: Record<string, unknown>;
    platform_settings?: Record<string, unknown>;
  }
) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase.from("platform_settings").select("id").limit(1).single();

  if (existing) {
    await supabase
      .from("platform_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("platform_settings").insert({
      commission_percentage: 5,
      seller_fee_percentage: 7,
      buyer_fee_percentage: 0,
      email_templates: {},
      authentication_rules: {},
      platform_settings: {},
      ...settings,
    });
  }

  await logAdminAction({
    adminId,
    action: "update_settings",
    resourceType: "platform_settings",
    details: settings,
  });

  revalidatePath("/settings");
  return { success: true };
}
