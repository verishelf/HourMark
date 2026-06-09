"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import {
  logDealerChangelog,
  logDealerFieldChanges,
  normalizeEmail,
  normalizeInstagram,
  normalizeWebsite,
} from "@/lib/dealer-audit";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/permissions";
import type {
  AdminRole,
  Dealer,
  DealerActivityType,
  DealerPipelineStatus,
  DealerTaskPriority,
  DealerTaskStatus,
} from "@/types/database";
import * as XLSX from "xlsx";

async function getAdminRole(adminId: string): Promise<AdminRole | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("admin_role")
    .eq("id", adminId)
    .single();
  return (data?.admin_role as AdminRole) ?? null;
}

async function requirePermission(adminId: string, permission: "dealers:read" | "dealers:write") {
  const role = await getAdminRole(adminId);
  if (!hasPermission(role, permission)) {
    throw new Error("Unauthorized");
  }
  return role;
}

async function requireSuperAdmin(adminId: string) {
  const role = await requirePermission(adminId, "dealers:write");
  if (role !== "super_admin") throw new Error("Super admin required");
  return role;
}

export async function createDealer(
  adminId: string,
  data: {
    company_name: string;
    contact_name: string;
    email: string;
    phone?: string;
    website?: string;
    instagram?: string;
    city?: string;
    country?: string;
    inventory_value?: number;
    estimated_monthly_sales?: number;
    watch_count?: number;
    instagram_followers?: number;
    notes?: string;
  }
) {
  await requirePermission(adminId, "dealers:write");
  const supabase = createServiceClient();

  const settings = await supabase.from("platform_settings").select("seller_fee_percentage").limit(1).single();
  const defaultRate = settings.data?.seller_fee_percentage ?? 7;

  const { data: dealer, error } = await supabase
    .from("dealers")
    .insert({
      company_name: data.company_name,
      contact_name: data.contact_name,
      email: normalizeEmail(data.email),
      phone: data.phone ?? null,
      website: data.website ? normalizeWebsite(data.website) : null,
      instagram: data.instagram ? normalizeInstagram(data.instagram) : null,
      city: data.city ?? null,
      country: data.country ?? null,
      inventory_value: data.inventory_value ?? 0,
      estimated_monthly_sales: data.estimated_monthly_sales ?? 0,
      watch_count: data.watch_count ?? 0,
      instagram_followers: data.instagram_followers ?? 0,
      notes: data.notes ?? null,
      commission_rate: defaultRate,
      default_commission_rate: defaultRate,
      pipeline_status: "new_lead",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "create_dealer",
    resourceType: "dealer",
    resourceId: dealer.id,
    details: { company_name: data.company_name },
  });

  revalidatePath("/dealers");
  return { success: true, dealer: dealer as Dealer };
}

export async function updateDealer(
  adminId: string,
  dealerId: string,
  updates: Partial<{
    company_name: string;
    contact_name: string;
    email: string;
    phone: string | null;
    website: string | null;
    instagram: string | null;
    city: string | null;
    country: string | null;
    inventory_value: number;
    estimated_monthly_sales: number;
    watch_count: number;
    instagram_followers: number;
    notes: string | null;
    assigned_to: string | null;
    user_id: string | null;
  }>
) {
  await requirePermission(adminId, "dealers:write");
  const supabase = createServiceClient();

  const { data: existing } = await supabase.from("dealers").select("*").eq("id", dealerId).single();
  if (!existing) return { error: "Dealer not found" };

  const payload: Record<string, unknown> = { ...updates };
  if (updates.email) payload.email = normalizeEmail(updates.email);
  if (updates.website) payload.website = normalizeWebsite(updates.website);
  if (updates.instagram) payload.instagram = normalizeInstagram(updates.instagram);

  const { data: updated, error } = await supabase
    .from("dealers")
    .update(payload)
    .eq("id", dealerId)
    .select()
    .single();

  if (error) return { error: error.message };

  await logDealerFieldChanges(adminId, dealerId, existing, updated, Object.keys(updates));
  await logAdminAction({
    adminId,
    action: "update_dealer",
    resourceType: "dealer",
    resourceId: dealerId,
  });

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${dealerId}`);
  return { success: true, dealer: updated as Dealer };
}

export async function deleteDealer(adminId: string, dealerId: string) {
  await requireSuperAdmin(adminId);
  const supabase = createServiceClient();
  const { error } = await supabase.from("dealers").delete().eq("id", dealerId);
  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "delete_dealer",
    resourceType: "dealer",
    resourceId: dealerId,
  });

  revalidatePath("/dealers");
  return { success: true };
}

export async function updatePipelineStatus(
  adminId: string,
  dealerId: string,
  status: DealerPipelineStatus
) {
  await requirePermission(adminId, "dealers:write");
  const supabase = createServiceClient();

  const { data: existing } = await supabase.from("dealers").select("pipeline_status").eq("id", dealerId).single();
  if (!existing) return { error: "Dealer not found" };

  const { error } = await supabase
    .from("dealers")
    .update({ pipeline_status: status })
    .eq("id", dealerId);

  if (error) return { error: error.message };

  await logDealerChangelog({
    dealerId,
    adminId,
    fieldName: "pipeline_status",
    oldValue: existing.pipeline_status,
    newValue: status,
  });

  await logAdminAction({
    adminId,
    action: "update_pipeline_status",
    resourceType: "dealer",
    resourceId: dealerId,
    details: { status },
  });

  revalidatePath("/dealers");
  revalidatePath("/dealers/pipeline");
  revalidatePath(`/dealers/${dealerId}`);
  return { success: true };
}

export async function approveLaunchPartner(adminId: string, dealerId: string) {
  await requireSuperAdmin(adminId);
  const supabase = createServiceClient();

  const start = new Date();
  const expires = new Date(start);
  expires.setMonth(expires.getMonth() + 6);

  const { data: existing } = await supabase.from("dealers").select("is_launch_partner").eq("id", dealerId).single();
  if (!existing) return { error: "Dealer not found" };

  const { error } = await supabase
    .from("dealers")
    .update({
      is_launch_partner: true,
      launch_partner_start: start.toISOString(),
      launch_partner_expires: expires.toISOString(),
      commission_rate: 0,
    })
    .eq("id", dealerId);

  if (error) return { error: error.message };

  await logDealerChangelog({
    dealerId,
    adminId,
    fieldName: "is_launch_partner",
    oldValue: String(existing.is_launch_partner),
    newValue: "true",
  });

  await logAdminAction({
    adminId,
    action: "approve_launch_partner",
    resourceType: "dealer",
    resourceId: dealerId,
  });

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${dealerId}`);
  return { success: true };
}

export async function revokeLaunchPartner(adminId: string, dealerId: string) {
  await requireSuperAdmin(adminId);
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("dealers")
    .select("is_launch_partner, default_commission_rate")
    .eq("id", dealerId)
    .single();
  if (!existing) return { error: "Dealer not found" };

  const { error } = await supabase
    .from("dealers")
    .update({
      is_launch_partner: false,
      commission_rate: existing.default_commission_rate,
    })
    .eq("id", dealerId);

  if (error) return { error: error.message };

  await logDealerChangelog({
    dealerId,
    adminId,
    fieldName: "is_launch_partner",
    oldValue: "true",
    newValue: "false",
  });

  await logAdminAction({
    adminId,
    action: "revoke_launch_partner",
    resourceType: "dealer",
    resourceId: dealerId,
  });

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${dealerId}`);
  return { success: true };
}

export async function updateCommissionRate(adminId: string, dealerId: string, rate: number) {
  await requireSuperAdmin(adminId);
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("dealers")
    .select("commission_rate, is_launch_partner")
    .eq("id", dealerId)
    .single();
  if (!existing) return { error: "Dealer not found" };
  if (existing.is_launch_partner) return { error: "Cannot change rate while Launch Partner is active" };

  const { error } = await supabase
    .from("dealers")
    .update({ commission_rate: rate, default_commission_rate: rate })
    .eq("id", dealerId);

  if (error) return { error: error.message };

  await logDealerChangelog({
    dealerId,
    adminId,
    fieldName: "commission_rate",
    oldValue: String(existing.commission_rate),
    newValue: String(rate),
  });

  await logAdminAction({
    adminId,
    action: "update_commission_rate",
    resourceType: "dealer",
    resourceId: dealerId,
    details: { rate },
  });

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${dealerId}`);
  return { success: true };
}

export async function linkDealerToUser(adminId: string, dealerId: string, userId: string) {
  await requirePermission(adminId, "dealers:write");
  const supabase = createServiceClient();

  const { data: existing } = await supabase.from("dealers").select("user_id").eq("id", dealerId).single();
  if (!existing) return { error: "Dealer not found" };

  const { error } = await supabase
    .from("dealers")
    .update({ user_id: userId, pipeline_status: "account_created" })
    .eq("id", dealerId);

  if (error) return { error: error.message };

  await logDealerChangelog({
    dealerId,
    adminId,
    fieldName: "user_id",
    oldValue: existing.user_id,
    newValue: userId,
  });

  revalidatePath(`/dealers/${dealerId}`);
  return { success: true };
}

export async function logActivity(
  adminId: string,
  dealerId: string,
  data: {
    activity_type: DealerActivityType;
    notes?: string;
    outcome?: string;
    next_follow_up_at?: string;
  }
) {
  await requirePermission(adminId, "dealers:write");
  const supabase = createServiceClient();

  const { error } = await supabase.from("dealer_activities").insert({
    dealer_id: dealerId,
    activity_type: data.activity_type,
    notes: data.notes ?? null,
    outcome: data.outcome ?? null,
    next_follow_up_at: data.next_follow_up_at ?? null,
    created_by: adminId,
  });

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "log_dealer_activity",
    resourceType: "dealer",
    resourceId: dealerId,
    details: { activity_type: data.activity_type },
  });

  revalidatePath(`/dealers/${dealerId}`);
  return { success: true };
}

export async function createTask(
  adminId: string,
  dealerId: string,
  data: {
    title: string;
    assigned_to?: string;
    due_at?: string;
    priority?: DealerTaskPriority;
  }
) {
  await requirePermission(adminId, "dealers:write");
  const supabase = createServiceClient();

  const { error } = await supabase.from("dealer_tasks").insert({
    dealer_id: dealerId,
    title: data.title,
    assigned_to: data.assigned_to ?? null,
    due_at: data.due_at ?? null,
    priority: data.priority ?? "medium",
    status: "open",
  });

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "create_dealer_task",
    resourceType: "dealer",
    resourceId: dealerId,
    details: { title: data.title },
  });

  revalidatePath(`/dealers/${dealerId}`);
  return { success: true };
}

export async function updateTask(
  adminId: string,
  taskId: string,
  dealerId: string,
  updates: {
    title?: string;
    assigned_to?: string | null;
    due_at?: string | null;
    status?: DealerTaskStatus;
    priority?: DealerTaskPriority;
  }
) {
  await requirePermission(adminId, "dealers:write");
  const supabase = createServiceClient();

  const { error } = await supabase.from("dealer_tasks").update(updates).eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath(`/dealers/${dealerId}`);
  return { success: true };
}

export async function completeTask(adminId: string, taskId: string, dealerId: string) {
  return updateTask(adminId, taskId, dealerId, { status: "done" });
}

type CsvRow = {
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  city?: string;
  country?: string;
  inventory_value?: string | number;
};

const CSV_COLUMN_MAP: Record<string, keyof CsvRow> = {
  "company name": "company_name",
  "contact name": "contact_name",
  email: "email",
  phone: "phone",
  website: "website",
  instagram: "instagram",
  city: "city",
  country: "country",
  "inventory value": "inventory_value",
};

function parseCsvRows(csvText: string): CsvRow[] {
  const workbook = XLSX.read(csvText, { type: "string" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

  return raw.map((row) => {
    const mapped: CsvRow = {};
    for (const [key, value] of Object.entries(row)) {
      const normalized = key.trim().toLowerCase();
      const field = CSV_COLUMN_MAP[normalized];
      if (field) mapped[field] = value;
    }
    return mapped;
  });
}

async function isDuplicate(
  supabase: ReturnType<typeof createServiceClient>,
  row: CsvRow
): Promise<boolean> {
  const conditions: string[] = [];
  if (row.email) conditions.push(`email.eq.${normalizeEmail(String(row.email))}`);
  if (row.website) conditions.push(`website.eq.${normalizeWebsite(String(row.website))}`);
  if (row.instagram) conditions.push(`instagram.eq.${normalizeInstagram(String(row.instagram))}`);
  if (conditions.length === 0) return false;

  const { data } = await supabase.from("dealers").select("id").or(conditions.join(",")).limit(1);
  return (data?.length ?? 0) > 0;
}

export async function importDealersFromCsv(adminId: string, csvText: string) {
  await requirePermission(adminId, "dealers:write");
  const supabase = createServiceClient();
  const settings = await supabase.from("platform_settings").select("seller_fee_percentage").limit(1).single();
  const defaultRate = settings.data?.seller_fee_percentage ?? 7;

  const rows = parseCsvRows(csvText);
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.company_name || !row.contact_name || !row.email) {
      errors.push(`Row ${i + 2}: missing required fields`);
      skipped++;
      continue;
    }

    if (await isDuplicate(supabase, row)) {
      skipped++;
      continue;
    }

    const inventoryRaw = row.inventory_value;
    const inventoryCents = inventoryRaw
      ? Math.round(parseFloat(String(inventoryRaw).replace(/[,$]/g, "")) * 100)
      : 0;

    const { error } = await supabase.from("dealers").insert({
      company_name: row.company_name,
      contact_name: row.contact_name,
      email: normalizeEmail(String(row.email)),
      phone: row.phone ?? null,
      website: row.website ? normalizeWebsite(String(row.website)) : null,
      instagram: row.instagram ? normalizeInstagram(String(row.instagram)) : null,
      city: row.city ?? null,
      country: row.country ?? null,
      inventory_value: inventoryCents,
      commission_rate: defaultRate,
      default_commission_rate: defaultRate,
      pipeline_status: "new_lead",
    });

    if (error) {
      errors.push(`Row ${i + 2}: ${error.message}`);
      skipped++;
    } else {
      created++;
    }
  }

  await logAdminAction({
    adminId,
    action: "import_dealers_csv",
    resourceType: "dealer",
    details: { created, skipped, errors: errors.length },
  });

  revalidatePath("/dealers");
  return { success: true, created, skipped, errors };
}
