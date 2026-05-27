import { COMMISSION_RATE } from "@/constants/colors";

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const isStripeConfigured = Boolean(STRIPE_PUBLISHABLE_KEY);

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
