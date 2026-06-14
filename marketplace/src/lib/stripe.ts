import { getStripePublishableKey, isStripeConfigured } from "@/lib/env";

export { isStripeConfigured };
export { getStripePublishableKey };

/** 7% marketplace fee — matches iOS app */
export const COMMISSION_RATE = 0.07;

export function calculateCommission(amountCents: number): number {
  return Math.round(amountCents * COMMISSION_RATE);
}

export function calculateSellerPayout(amountCents: number): number {
  return amountCents - calculateCommission(amountCents);
}

export function formatStripeError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("not verified for payouts")) {
    return "This seller is not set up to receive payments yet.";
  }
  if (lower.includes("cannot buy your own")) {
    return "You cannot purchase your own listing.";
  }
  return message;
}
