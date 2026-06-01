import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { OrderStatus } from "@/types";

export async function confirmDelivery(orderId: string): Promise<OrderStatus> {
  if (!isSupabaseConfigured) return "inspection_period";

  const { data, error } = await supabase.functions.invoke("confirm-delivery", {
    body: { orderId },
  });
  if (error) throw new Error(error.message);
  if (data?.message) throw new Error(data.message);
  return data.status as OrderStatus;
}

export async function releaseEscrow(orderId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data, error } = await supabase.functions.invoke("release-escrow", {
    body: { orderId },
  });
  if (error) throw new Error(error.message);
  if (data?.message) throw new Error(data.message);
}

export async function updateOrderTracking(
  orderId: string,
  trackingNumber: string,
  carrier?: string
): Promise<OrderStatus> {
  if (!isSupabaseConfigured) return "shipped";

  const { data, error } = await supabase.functions.invoke("update-order-shipping", {
    body: { orderId, trackingNumber, carrier },
  });
  if (error) throw new Error(error.message);
  if (data?.message) throw new Error(data.message);
  return data.status as OrderStatus;
}

export async function openOrderDispute(
  orderId: string,
  reason: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from("orders")
    .update({
      dispute_status: "open",
      dispute_reason: reason,
      escrow_status: "disputed",
      status: "disputed",
    })
    .eq("id", orderId);
  if (error) throw error;
}
