"use client";

import { Badge } from "@/components/ui/badge";
import { launchPartnerRemaining } from "@/lib/dealer-scoring";

export function DealerLaunchPartnerBadge({
  isLaunchPartner,
  expiresAt,
  compact = false,
}: {
  isLaunchPartner: boolean;
  expiresAt: string | null;
  compact?: boolean;
}) {
  if (!isLaunchPartner) return null;

  const { daysRemaining, monthsRemaining, isActive } = launchPartnerRemaining(expiresAt);

  if (!isActive) return null;

  if (compact) {
    return (
      <Badge variant="success" className="text-[10px] uppercase tracking-wider">
        LP · 0%
      </Badge>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <Badge variant="success" className="uppercase tracking-wider text-xs">
          Launch Partner
        </Badge>
        <span className="text-sm font-semibold text-emerald-400">0% FEES</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {monthsRemaining} mo · {daysRemaining} days remaining
      </span>
    </div>
  );
}
