"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { sendEmail } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import type { AdminRole } from "@/types/database";

export async function suspendUser(adminId: string, userId: string, suspended: boolean) {
  const supabase = createServiceClient();
  await supabase.from("users").update({ suspended }).eq("id", userId);
  await logAdminAction({
    adminId,
    action: suspended ? "suspend_user" : "unsuspend_user",
    resourceType: "user",
    resourceId: userId,
  });
  revalidatePath("/users");
  return { success: true };
}

export async function verifyUser(adminId: string, userId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("users")
    .update({ verified: true, is_verified_seller: true, kyc_status: "approved" })
    .eq("id", userId);
  await logAdminAction({ adminId, action: "verify_user", resourceType: "user", resourceId: userId });
  revalidatePath("/users");
  return { success: true };
}

export async function changeUserRole(adminId: string, userId: string, role: AdminRole | null) {
  const supabase = createServiceClient();
  await supabase.from("users").update({ admin_role: role }).eq("id", userId);
  await logAdminAction({
    adminId,
    action: "change_role",
    resourceType: "user",
    resourceId: userId,
    details: { role },
  });
  revalidatePath("/users");
  return { success: true };
}

export async function sendUserEmail(adminId: string, email: string, subject: string, body: string) {
  const result = await sendEmail({
    to: email,
    subject,
    html: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-weight: 300; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 16px;">Crownly</h1>
      <div style="margin-top: 24px; line-height: 1.6;">${body}</div>
    </div>`,
  });

  await logAdminAction({
    adminId,
    action: "send_email",
    resourceType: "user",
    details: { email, subject },
  });

  return { success: !result.error, error: result.error?.message };
}
