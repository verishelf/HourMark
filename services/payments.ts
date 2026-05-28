import { calculateCommission, calculateSellerPayout } from "@/lib/stripe";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Order, ShippingDetails } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getFunctionsBaseUrl(): string {
  if (API_URL) return API_URL.replace(/\/$/, "");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
  }

  return "";
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    throw new Error("You must be signed in to continue");
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
  paymentMethod?: "card" | "apple_pay";
  shipping: ShippingDetails;
}): Promise<{
  clientSecret: string;
  orderId: string;
  commissionFee?: number;
  sellerPayout?: number;
}> {
  const baseUrl = getFunctionsBaseUrl();

  if (!isSupabaseConfigured || !baseUrl) {
    return {
      clientSecret: "mock_client_secret",
      orderId: `order-${Date.now()}`,
      commissionFee: calculateCommission(params.amountCents),
      sellerPayout: calculateSellerPayout(params.amountCents),
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${baseUrl}/create-payment-intent`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      listingId: params.listingId,
      amount: params.amountCents,
      paymentMethod: params.paymentMethod ?? "card",
      shipping: params.shipping,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to create payment intent");
  }

  return response.json();
}

export type WireOrderResult = {
  orderId: string;
  wireReference: string;
  bankName: string;
  accountName: string;
  routingNumber: string;
  accountNumber: string;
  swiftCode: string;
  bankAddress: string;
};

export async function createWireTransferOrder(params: {
  listingId: string;
  amountCents: number;
  shipping: ShippingDetails;
}): Promise<WireOrderResult> {
  const baseUrl = getFunctionsBaseUrl();

  if (!isSupabaseConfigured || !baseUrl) {
    return {
      orderId: `order-${Date.now()}`,
      wireReference: "HM-DEMO1234",
      bankName: "Demo Bank",
      accountName: "HourMark Inc.",
      routingNumber: "021000021",
      accountNumber: "Demo mode — configure wire details",
      swiftCode: "CHASUS33",
      bankAddress: "New York, NY",
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${baseUrl}/create-wire-order`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      listingId: params.listingId,
      amount: params.amountCents,
      shipping: params.shipping,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to create wire transfer order");
  }

  return response.json();
}

/** @deprecated Use startSellerVerification from services/verification instead */
export async function createConnectAccountLink(
  _userId: string,
  returnUrl: string
): Promise<string> {
  const { startSellerVerification } = await import("@/services/verification");
  const returnPath = returnUrl.includes("sell") ? "sell" : "profile";
  return startSellerVerification(returnPath);
}

export async function getConnectStatus(): Promise<ConnectStatus | null> {
  const { getSellerVerificationStatus } = await import("@/services/verification");
  const status = await getSellerVerificationStatus();

  return {
    hasAccount: status.status !== "not_started",
    onboardingComplete: status.status === "verified",
    chargesEnabled: status.chargesEnabled,
    payoutsEnabled: status.payoutsEnabled,
    detailsSubmitted: status.status === "verified" || status.status === "pending",
  };
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
    });
  }

  await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);

  await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", order.listing_id);
}

export { calculateCommission };
