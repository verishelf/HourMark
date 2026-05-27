import { calculateCommission, calculateSellerPayout } from "@/lib/stripe";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Order } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return headers;
}

export type ConnectStatus = {
  hasAccount: boolean;
  accountId?: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

export async function createPaymentIntent(params: {
  listingId: string;
  buyerId: string;
  amountCents: number;
}): Promise<{
  clientSecret: string;
  orderId: string;
  commissionFee: number;
  sellerPayout: number;
}> {
  if (!isSupabaseConfigured || !API_URL) {
    return {
      clientSecret: "mock_client_secret",
      orderId: `order-${Date.now()}`,
      commissionFee: calculateCommission(params.amountCents),
      sellerPayout: calculateSellerPayout(params.amountCents),
    };
  }

  const response = await fetch(`${API_URL}/api/payments/create-intent`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      listingId: params.listingId,
      buyerId: params.buyerId,
      amount: params.amountCents,
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
    headers: await getAuthHeaders(),
    body: JSON.stringify({ userId, returnUrl }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to create Connect onboarding link");
  }

  const { url } = await response.json();
  return url;
}

export async function getConnectStatus(): Promise<ConnectStatus | null> {
  if (!API_URL) return null;

  const response = await fetch(`${API_URL}/api/stripe/connect/status`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) return null;
  return response.json();
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

export async function getOrderById(orderId: string): Promise<Order | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*, listing:listings(*)")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Order | null;
}

/** Idempotent client-side completion; webhooks are the source of truth. */
export async function completeOrder(orderId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order || order.status === "paid") return;

  const sellerPayout = calculateSellerPayout(order.amount);

  const { data: existingTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!existingTx) {
    await supabase.from("transactions").insert({
      order_id: orderId,
      amount: order.amount,
      commission_fee: order.commission_fee,
      seller_payout: sellerPayout,
      status: "completed",
    });
  }

  await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);

  await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", order.listing_id);
}
