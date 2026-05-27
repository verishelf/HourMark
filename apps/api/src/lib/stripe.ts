import Stripe from "stripe";
import { env } from "../config/env.js";

export const stripe = new Stripe(env.stripeSecretKey || "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
});

export const PLATFORM_COMMISSION_RATE = env.platformCommissionRate;

export function calculateCommission(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_COMMISSION_RATE);
}

export function calculateSellerPayout(amountCents: number): number {
  return amountCents - calculateCommission(amountCents);
}
