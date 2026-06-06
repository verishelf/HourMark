"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { sendEmail } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import type { AuthRequestStatus } from "@/types/database";

export async function updateAuthStatus(
  adminId: string,
  requestId: string,
  status: AuthRequestStatus
) {
  const supabase = createServiceClient();
  await supabase
    .from("authentication_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  await logAdminAction({
    adminId,
    action: "update_auth_status",
    resourceType: "authentication_request",
    resourceId: requestId,
    details: { status },
  });
  revalidatePath("/authentication");
  return { success: true };
}

export async function updateInspectionNotes(
  adminId: string,
  requestId: string,
  notes: string
) {
  const supabase = createServiceClient();
  await supabase
    .from("authentication_requests")
    .update({ inspection_notes: notes, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  await logAdminAction({
    adminId,
    action: "update_inspection_notes",
    resourceType: "authentication_request",
    resourceId: requestId,
  });
  revalidatePath("/authentication");
  return { success: true };
}

export async function notifyAuthParty(
  adminId: string,
  requestId: string,
  party: "buyer" | "seller",
  email: string,
  message: string
) {
  const result = await sendEmail({
    to: email,
    subject: `Authentication Update — ${party === "buyer" ? "Your Watch" : "Listing Verification"}`,
    html: `<div style="font-family: Georgia, serif; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
      <h1 style="font-weight: 300; letter-spacing: 2px;">Crownly Authentication</h1>
      <p style="line-height: 1.6; margin-top: 24px;">${message}</p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">Reference: ${requestId.slice(0, 8)}</p>
    </div>`,
  });

  if (!result.ok) return { error: result.error };

  await logAdminAction({
    adminId,
    action: `notify_${party}`,
    resourceType: "authentication_request",
    resourceId: requestId,
  });
  return { success: true };
}
