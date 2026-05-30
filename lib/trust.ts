import type { AuthenticationStatus } from "@/types";
import type { FraudFlag, TrustBadgeId } from "@/types/trust";

export const AUTO_APPROVE_TRUST_SCORE = 80;
export const MANUAL_REVIEW_TRUST_SCORE = 55;
export const INSPECTION_PERIOD_DAYS = 3;

const BRAND_MIN_PRICE_CENTS: Record<string, number> = {
  Rolex: 300000,
  "Audemars Piguet": 800000,
  "Patek Philippe": 1000000,
  Cartier: 150000,
  Omega: 50000,
  "Richard Mille": 1500000,
};

export function normalizeSerial(serial: string): string {
  return serial.replace(/[\s\-_.]/g, "").toUpperCase();
}

export function isSuspiciousSerialPattern(serial: string): boolean {
  const n = normalizeSerial(serial);
  if (n.length < 4 || n.length > 20) return true;
  if (/^(.)\1{5,}$/.test(n)) return true;
  if (/^(TEST|FAKE|0000|1234)/i.test(n)) return true;
  return false;
}

export function validateSerialFormat(brand: string, serial: string): boolean {
  const n = normalizeSerial(serial);
  if (!n) return false;
  if (brand === "Rolex" && !/^[A-Z0-9]{6,8}$/.test(n)) return false;
  return n.length >= 4;
}

export function isSuspiciousPrice(brand: string, priceCents: number): boolean {
  const min = BRAND_MIN_PRICE_CENTS[brand];
  if (!min) return priceCents < 10000;
  return priceCents < min * 0.35;
}

export function resolveAuthenticationStatus(
  trustScore: number,
  fraudRisk: number,
  flags: FraudFlag[]
): AuthenticationStatus {
  if (fraudRisk >= 75 || flags.includes("duplicate_serial")) return "rejected";
  if (trustScore >= AUTO_APPROVE_TRUST_SCORE && fraudRisk < 40) return "auto_verified";
  if (trustScore >= MANUAL_REVIEW_TRUST_SCORE) return "manual_review";
  if (trustScore < 40 || fraudRisk >= 60) return "rejected";
  return "manual_review";
}

export function buildTrustBadges(input: {
  sellerVerified: boolean;
  authenticationStatus: AuthenticationStatus;
  trustScore: number;
  hasBoxPapers: boolean;
  accountTrustScore: number;
}): TrustBadgeId[] {
  const badges: TrustBadgeId[] = ["escrow_protected"];
  if (input.sellerVerified) badges.push("verified_seller");
  if (input.authenticationStatus === "auto_verified" && input.trustScore >= 70) {
    badges.push("ai_authenticated");
  }
  if (input.hasBoxPapers) badges.push("full_set");
  if (input.accountTrustScore >= 85) badges.push("trusted_seller");
  return badges;
}

export function trustScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Reviewing";
  return "At risk";
}

export function authenticationStatusLabel(status: AuthenticationStatus): string {
  switch (status) {
    case "auto_verified":
      return "AI Verified";
    case "manual_review":
      return "Under Review";
    case "analyzing":
      return "Analyzing…";
    case "rejected":
      return "Not Approved";
    default:
      return "Pending Verification";
  }
}
