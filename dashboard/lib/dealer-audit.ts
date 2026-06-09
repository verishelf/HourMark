import { createServiceClient } from "@/lib/supabase/server";

export async function logDealerChangelog({
  dealerId,
  adminId,
  fieldName,
  oldValue,
  newValue,
}: {
  dealerId: string;
  adminId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}) {
  if (oldValue === newValue) return;
  const supabase = createServiceClient();
  await supabase.from("dealer_changelog").insert({
    dealer_id: dealerId,
    admin_id: adminId,
    field_name: fieldName,
    old_value: oldValue,
    new_value: newValue,
  });
}

export async function logDealerFieldChanges(
  adminId: string,
  dealerId: string,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>,
  fields: string[]
) {
  for (const field of fields) {
    const oldVal = oldRecord[field];
    const newVal = newRecord[field];
    if (String(oldVal ?? "") !== String(newVal ?? "")) {
      await logDealerChangelog({
        dealerId,
        adminId,
        fieldName: field,
        oldValue: oldVal != null ? String(oldVal) : null,
        newValue: newVal != null ? String(newVal) : null,
      });
    }
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeWebsite(url: string): string {
  return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function normalizeInstagram(handle: string): string {
  return handle.trim().toLowerCase().replace(/^@/, "");
}
