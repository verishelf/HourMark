"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function releaseFunds(adminId: string, transactionId: string, orderId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("transactions")
    .update({ status: "completed" })
    .eq("id", transactionId);

  await supabase
    .from("orders")
    .update({ escrow_status: "released", funds_released_at: new Date().toISOString(), status: "completed" })
    .eq("id", orderId);

  await logAdminAction({
    adminId,
    action: "release_funds",
    resourceType: "transaction",
    resourceId: transactionId,
  });
  revalidatePath("/transactions");
  return { success: true };
}

export async function refundTransaction(adminId: string, transactionId: string, orderId: string) {
  const supabase = createServiceClient();
  await supabase.from("transactions").update({ status: "refunded" }).eq("id", transactionId);
  await supabase.from("orders").update({ status: "refunded" }).eq("id", orderId);

  await logAdminAction({
    adminId,
    action: "refund_transaction",
    resourceType: "transaction",
    resourceId: transactionId,
  });
  revalidatePath("/transactions");
  return { success: true };
}
