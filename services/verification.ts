import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { VerificationStatus } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to verify your seller account");
  }

  return {
    Authorization: `Bearer ${token}`,
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
}

function getFunctionsBaseUrl(): string {
  if (API_URL) return API_URL.replace(/\/$/, "");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
  }

  return "";
}

export function getConnectReturnRedirectUrl(): string {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/connect-return`;
  }

  if (API_URL) {
    return `${API_URL.replace(/\/$/, "")}/connect-return`;
  }

  return "";
}

export async function startSellerVerification(
  returnPath: "profile" | "sell" = "profile"
): Promise<string> {
  const baseUrl = getFunctionsBaseUrl();

  if (!isSupabaseConfigured || !baseUrl) {
    throw new Error("Seller verification is not configured yet");
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${baseUrl}/connect-onboard`, {
    method: "POST",
    headers,
    body: JSON.stringify({ returnPath }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = err.message ?? err.error ?? "Failed to start seller verification";
    if (message.includes("signed up for Connect")) {
      throw new Error(
        "Stripe Connect is not enabled on your Stripe account. Enable it at dashboard.stripe.com/connect, then try again."
      );
    }
    throw new Error(message);
  }

  const { url } = await response.json();
  return url;
}

export async function getSellerVerificationStatus(): Promise<VerificationStatus> {
  const baseUrl = getFunctionsBaseUrl();

  if (!isSupabaseConfigured || !baseUrl) {
    return {
      status: "not_started",
      chargesEnabled: false,
      payoutsEnabled: false,
      requirementsDue: [],
      rejectionReason: null,
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${baseUrl}/connect-status`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to load verification status");
  }

  return response.json();
}

export function getVerificationStatusLabel(status: VerificationStatus["status"]): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "pending":
      return "In progress";
    case "action_required":
      return "Action required";
    default:
      return "Not started";
  }
}
