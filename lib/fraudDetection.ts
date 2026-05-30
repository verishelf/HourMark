import {
  isSuspiciousPrice,
  isSuspiciousSerialPattern,
  validateSerialFormat,
} from "@/lib/trust";
import type { FraudFlag } from "@/types/trust";

export type FraudInput = {
  brand: string;
  priceCents: number;
  serial?: string | null;
  rejectedListingCount?: number;
  listingsLast24h?: number;
  accountTrustScore?: number;
  imageFlagCount?: number;
};

export function calculateFraudRisk(input: FraudInput): number {
  const flags = collectFraudFlags(input);
  let risk = Math.max(0, 100 - (input.accountTrustScore ?? 50));
  if (flags.includes("suspicious_price")) risk += 25;
  if (flags.includes("suspicious_serial")) risk += 20;
  if ((input.rejectedListingCount ?? 0) >= 3) risk += 15;
  if ((input.listingsLast24h ?? 0) >= 5) risk += 20;
  if ((input.imageFlagCount ?? 0) >= 2) risk += 15;
  return Math.min(100, risk);
}

export function collectFraudFlags(input: FraudInput): FraudFlag[] {
  const flags: FraudFlag[] = [];
  if (isSuspiciousPrice(input.brand, input.priceCents)) flags.push("suspicious_price");
  if (input.serial) {
    if (isSuspiciousSerialPattern(input.serial)) flags.push("suspicious_serial");
    if (!validateSerialFormat(input.brand, input.serial)) flags.push("suspicious_serial");
  }
  if ((input.imageFlagCount ?? 0) >= 2) flags.push("high_fraud_risk");
  return flags;
}

export function accountTrustScoreFromActivity(input: {
  verifiedSeller: boolean;
  completedSales: number;
  rejectedListings: number;
  fraudRisk: number;
}): number {
  let score = 40;
  if (input.verifiedSeller) score += 25;
  score += Math.min(25, input.completedSales * 3);
  score -= input.rejectedListings * 5;
  score -= Math.round(input.fraudRisk * 0.2);
  return Math.min(100, Math.max(0, score));
}
