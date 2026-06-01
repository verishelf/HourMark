import { COMMISSION_RATE } from "@/constants/colors";

/** Fixes accidental double-paste in .env (pk_live_...pk_live_...). */
function normalizePublishableKey(raw: string): string {
  const trimmed = raw.trim();
  const secondPk = trimmed.indexOf("pk_", 3);
  if (secondPk > 0) return trimmed.slice(0, secondPk);
  return trimmed;
}

export const STRIPE_PUBLISHABLE_KEY = normalizePublishableKey(
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

export const isStripeConfigured =
  STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_") ||
  STRIPE_PUBLISHABLE_KEY.startsWith("pk_test_");

/** Required for iOS Payment Sheet redirect-based methods (3DS, some wallets). */
export const STRIPE_RETURN_URL = "crownly://stripe-redirect";

export function getStripeKeyMode(key: string): "live" | "test" | "invalid" {
  if (key.startsWith("pk_live_") || key.startsWith("sk_live_")) return "live";
  if (key.startsWith("pk_test_") || key.startsWith("sk_test_")) return "test";
  return "invalid";
}

/** User-facing hint when Stripe returns mode/key errors. */
export function formatStripePaymentError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid api key") && lower.includes("pk_test")) {
    return (
      "Stripe is using a test publishable key (pk_test). Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... to .env, then restart Expo with: npx expo start -c"
    );
  }
  if (lower.includes("invalid api key")) {
    return (
      "Stripe publishable key is invalid. In .env use a single pk_live_... line (no duplicate paste), save the file, then npx expo start -c."
    );
  }
  if (
    lower.includes("similar object") ||
    lower.includes("test mode") ||
    lower.includes("live mode")
  ) {
    return (
      "Stripe live/test mode mismatch. Use pk_live_ in the app and sk_live_ in Supabase secrets (supabase secrets set STRIPE_SECRET_KEY=sk_live_...)."
    );
  }
  return message;
}

export function calculateCommission(amountCents: number): number {
  return Math.round(amountCents * COMMISSION_RATE);
}

export function calculateSellerPayout(amountCents: number): number {
  return amountCents - calculateCommission(amountCents);
}

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
