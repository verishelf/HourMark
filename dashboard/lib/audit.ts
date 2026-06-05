import { createServiceClient } from "@/lib/supabase/server";

export async function logAdminAction({
  adminId,
  action,
  resourceType,
  resourceId,
  details = {},
}: {
  adminId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    details,
  });
}
