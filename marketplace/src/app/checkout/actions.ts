"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getFunctionsBaseUrl,
  getSupabaseAnonKey,
  isStripeConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import type { ShippingDetails } from "@/lib/types";
import { formatStripeError } from "@/lib/stripe";

export async function createPaymentIntentAction(input: {
  listingId: string;
  amountCents: number;
  shipping: ShippingDetails;
}): Promise<
  | { clientSecret: string; orderId: string; error?: undefined }
  | { error: string; clientSecret?: undefined; orderId?: undefined }
> {
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return { error: "Payments are not configured on this site." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Not signed in" };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Not signed in" };

  const baseUrl = getFunctionsBaseUrl();
  if (!baseUrl) return { error: "Payment service unavailable." };

  const response = await fetch(`${baseUrl}/create-payment-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: getSupabaseAnonKey(),
    },
    body: JSON.stringify({
      listingId: input.listingId,
      amount: input.amountCents,
      paymentMethod: "card",
      shipping: input.shipping,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    clientSecret?: string;
    orderId?: string;
    message?: string;
  };

  if (!response.ok) {
    return { error: formatStripeError(payload.message ?? "Payment setup failed") };
  }

  if (!payload.clientSecret || !payload.orderId) {
    return { error: "Invalid payment response from server." };
  }

  return { clientSecret: payload.clientSecret, orderId: payload.orderId };
}
