import { calculateCommission, calculateSellerPayout } from "@/lib/stripe";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Order } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export async function createPaymentIntent(params: {
  listingId: string;
  buyerId: string;
  amountCents: number;
}): Promise<{ clientSecret: string; orderId: string }> {
  const commissionFee = calculateCommission(params.amountCents);

  if (!isSupabaseConfigured || !API_URL) {
    return {
      clientSecret: "mock_client_secret",
      orderId: `order-${Date.now()}`,
    };
  }

  const response = await fetch(`${API_URL}/api/payments/create-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listingId: params.listingId,
      buyerId: params.buyerId,
      amount: params.amountCents,
      commissionFee,
      applicationFeeAmount: commissionFee,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to create payment intent");
  }

  return response.json();
}

export async function createConnectAccountLink(
  userId: string,
  returnUrl: string
): Promise<string> {
  if (!API_URL) {
    return returnUrl;
  }

  const response = await fetch(`${API_URL}/api/connect/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, returnUrl }),
  });

  if (!response.ok) throw new Error("Failed to create Connect onboarding link");
  const { url } = await response.json();
  return url;
}

export async function getOrders(userId: string): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*, listing:listings(*)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function completeOrder(orderId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return;

  const sellerPayout = calculateSellerPayout(order.amount);

  await supabase.from("transactions").insert({
    order_id: orderId,
    amount: order.amount,
    commission_fee: order.commission_fee,
    seller_payout: sellerPayout,
  });

  await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId);

  await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", order.listing_id);
}
