import type { DealerGrade } from "@/types/database";

const MARKET_SCORES: Record<string, number> = {
  dubai: 25,
  miami: 20,
  "new york": 20,
  nyc: 20,
  london: 20,
  "los angeles": 15,
  singapore: 15,
  "hong kong": 15,
};

function inventoryScore(cents: number): number {
  if (cents >= 500_000_000) return 100;
  if (cents >= 100_000_000) return 50;
  if (cents >= 50_000_000) return 25;
  if (cents >= 10_000_000) return 10;
  return 0;
}

function socialScore(followers: number): number {
  if (followers >= 100_000) return 40;
  if (followers >= 10_000) return 15;
  if (followers >= 1_000) return 5;
  return 0;
}

function marketScore(city: string | null, country: string | null): number {
  const cityLower = (city ?? "").toLowerCase().trim();
  const countryLower = (country ?? "").toLowerCase().trim();

  if (cityLower.includes("dubai") || countryLower === "uae") return 25;

  for (const [key, score] of Object.entries(MARKET_SCORES)) {
    if (cityLower === key || cityLower.includes(key)) return score;
  }

  return 0;
}

export function computeLeadScore(
  inventoryValueCents: number,
  instagramFollowers: number,
  city: string | null,
  country: string | null
): { score: number; grade: DealerGrade } {
  const score =
    inventoryScore(inventoryValueCents) +
    socialScore(instagramFollowers) +
    marketScore(city, country);

  let grade: DealerGrade = "C";
  if (score >= 80) grade = "A+";
  else if (score >= 60) grade = "A";
  else if (score >= 35) grade = "B";

  return { score, grade };
}

export function gradeVariant(grade: DealerGrade): "default" | "success" | "warning" | "secondary" | "destructive" {
  switch (grade) {
    case "A+":
      return "success";
    case "A":
      return "default";
    case "B":
      return "warning";
    default:
      return "secondary";
  }
}

export const DEALER_PIPELINE_STATUSES = [
  "new_lead",
  "contacted",
  "interested",
  "demo_scheduled",
  "proposal_sent",
  "account_created",
  "inventory_imported",
  "active_seller",
  "top_seller",
] as const;

export const PIPELINE_LABELS: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  interested: "Interested",
  demo_scheduled: "Demo Scheduled",
  proposal_sent: "Proposal Sent",
  account_created: "Account Created",
  inventory_imported: "Inventory Imported",
  active_seller: "Active Seller",
  top_seller: "Top Seller",
};

export function computeRevenueForecast(
  estimatedMonthlySalesCents: number,
  commissionRate: number
) {
  const monthlyRevenue = Math.round(estimatedMonthlySalesCents * (commissionRate / 100));
  const annualRevenue = monthlyRevenue * 12;
  return { monthlyRevenue, annualRevenue };
}

export function computeAvgWatchPrice(inventoryValueCents: number, watchCount: number): number | null {
  if (watchCount <= 0) return null;
  return Math.round(inventoryValueCents / watchCount);
}

export function launchPartnerRemaining(expiresAt: string | null): {
  daysRemaining: number;
  monthsRemaining: number;
  isActive: boolean;
} {
  if (!expiresAt) return { daysRemaining: 0, monthsRemaining: 0, isActive: false };
  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  if (expires <= now) return { daysRemaining: 0, monthsRemaining: 0, isActive: false };
  const daysRemaining = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.ceil(daysRemaining / 30);
  return { daysRemaining, monthsRemaining, isActive: true };
}
