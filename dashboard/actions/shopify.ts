"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import type { AdminRole } from "@/types/database";

async function getAdminRole(adminId: string): Promise<AdminRole | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("users").select("admin_role").eq("id", adminId).single();
  return (data?.admin_role as AdminRole) ?? null;
}

async function requireIntegrationsWrite(adminId: string) {
  const role = await getAdminRole(adminId);
  if (!hasPermission(role, "integrations:write")) {
    throw new Error("Unauthorized");
  }
  return role;
}

export async function adminForceShopifySync(adminId: string, storeId: string) {
  await requireIntegrationsWrite(adminId);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return { error: "Server configuration missing" };

  const response = await fetch(`${supabaseUrl}/functions/v1/shopify-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({ storeId }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { error: body.message ?? "Sync failed" };

  await logAdminAction({
    adminId,
    action: "shopify_force_sync",
    resourceType: "dealer_shopify_store",
    resourceId: storeId,
  });

  revalidatePath("/integrations/shopify");
  return { success: true, ...body };
}

export async function adminDisableShopifyIntegration(adminId: string, storeId: string) {
  await requireIntegrationsWrite(adminId);
  const supabase = createServiceClient();

  const { data: store } = await supabase
    .from("dealer_shopify_stores")
    .select("dealer_id")
    .eq("id", storeId)
    .single();

  const { error } = await supabase
    .from("dealer_shopify_stores")
    .update({
      integration_enabled: false,
      sync_status: "disabled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  if (error) return { error: error.message };

  if (store?.dealer_id) {
    await supabase.from("shopify_sync_logs").insert({
      dealer_id: store.dealer_id,
      store_id: storeId,
      sync_type: "admin_force",
      status: "success",
      metadata: { action: "disable_integration", admin_id: adminId },
    });
  }

  await logAdminAction({
    adminId,
    action: "shopify_disable",
    resourceType: "dealer_shopify_store",
    resourceId: storeId,
  });

  revalidatePath("/integrations/shopify");
  return { success: true };
}

export async function adminEnableShopifyIntegration(adminId: string, storeId: string) {
  await requireIntegrationsWrite(adminId);
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("dealer_shopify_stores")
    .update({
      integration_enabled: true,
      sync_status: "idle",
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "shopify_enable",
    resourceType: "dealer_shopify_store",
    resourceId: storeId,
  });

  revalidatePath("/integrations/shopify");
  return { success: true };
}
