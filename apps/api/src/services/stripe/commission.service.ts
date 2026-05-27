import {
  calculateCommission,
  calculateSellerPayout,
  PLATFORM_COMMISSION_RATE,
} from "../../lib/stripe.js";

export const commissionService = {
  rate: PLATFORM_COMMISSION_RATE,

  calculateCommission(amountCents: number): number {
    return calculateCommission(amountCents);
  },

  calculateSellerPayout(amountCents: number): number {
    return calculateSellerPayout(amountCents);
  },

  /**
   * Example: $10,000 watch → $300 platform fee, $9,700 to seller (before Stripe fees).
   */
  breakdown(amountCents: number) {
    const commissionFee = calculateCommission(amountCents);
    const sellerPayout = calculateSellerPayout(amountCents);
    return {
      amountCents,
      commissionFee,
      sellerPayout,
      commissionRate: PLATFORM_COMMISSION_RATE,
    };
  },
};
