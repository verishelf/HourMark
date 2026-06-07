import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/types";

const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "awaiting_payment"];

async function readFunctionErrorMessage(
  error: unknown,
  data: { message?: string } | null
): Promise<string> {
  if (data?.message) return data.message;

  if (error && typeof error === "object" && "context" in error) {
    const response = (error as { context?: { json?: () => Promise<{ message?: string }> } })
      .context;
    if (response && typeof response.json === "function") {
      try {
        const body = await response.json();
        if (body?.message) return body.message;
      } catch {
        // fall through
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message.replace(
      /^Edge Function returned a non-2xx status code$/,
      "Could not cancel order"
    );
  }

  return "Could not cancel order";
}

export function canCancelOrder(
  order: Pick<Order, "status" | "escrow_status">
): boolean {
  if (!CANCELLABLE_STATUSES.includes(order.status)) return false;
  if (order.escrow_status === "held") return false;
  return true;
}

export async function cancelOrder(orderId: string): Promise<OrderStatus> {
  if (!isSupabaseConfigured) return "cancelled";

  const { data, error } = await supabase.functions.invoke("cancel-order", {
    body: { orderId },
  });

  if (error || data?.message) {
    throw new Error(await readFunctionErrorMessage(error, data));
  }

  return (data?.status as OrderStatus) ?? "cancelled";
}

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
