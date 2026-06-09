"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DealerGradeBadge } from "@/components/dealers/dealer-grade-badge";
import { DealerLaunchPartnerBadge } from "@/components/dealers/dealer-launch-partner-badge";
import { DealerFormDialog } from "@/components/dealers/dealer-form-dialog";
import { PIPELINE_LABELS, computeRevenueForecast, computeAvgWatchPrice } from "@/lib/dealer-scoring";
import { approveLaunchPartner, revokeLaunchPartner } from "@/actions/dealers";
import { formatCurrency } from "@/lib/utils";
import type { AdminRole, DealerWithStats } from "@/types/database";

export function DealerDetailHeader({
  dealer,
  adminId,
  adminRole,
}: {
  dealer: DealerWithStats;
  adminId: string;
  adminRole: AdminRole | null;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const { monthlyRevenue, annualRevenue } = computeRevenueForecast(
    dealer.estimated_monthly_sales,
    dealer.commission_rate
  );
  const avgWatchPrice = computeAvgWatchPrice(dealer.inventory_value, dealer.watch_count);

  async function handleApproveLP() {
    const result = await approveLaunchPartner(adminId, dealer.id);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Launch Partner approved — 0% fees for 6 months");
  }

  async function handleRevokeLP() {
    const result = await revokeLaunchPartner(adminId, dealer.id);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Launch Partner revoked");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-semibold">{dealer.company_name}</h2>
            <DealerGradeBadge grade={dealer.lead_grade} score={dealer.lead_score} />
            <Badge variant="secondary">{PIPELINE_LABELS[dealer.pipeline_status]}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{dealer.contact_name} · {dealer.email}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            {dealer.phone && <span>{dealer.phone}</span>}
            {dealer.website && <span>{dealer.website}</span>}
            {dealer.instagram && <span>@{dealer.instagram}</span>}
            {(dealer.city || dealer.country) && (
              <span>{[dealer.city, dealer.country].filter(Boolean).join(", ")}</span>
            )}
          </div>
          {dealer.is_launch_partner && (
            <div className="mt-3">
              <DealerLaunchPartnerBadge
                isLaunchPartner={dealer.is_launch_partner}
                expiresAt={dealer.launch_partner_expires}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>Edit</Button>
          {adminRole === "super_admin" && !dealer.is_launch_partner && (
            <Button onClick={handleApproveLP}>Approve Launch Partner</Button>
          )}
          {adminRole === "super_admin" && dealer.is_launch_partner && (
            <Button variant="destructive" onClick={handleRevokeLP}>Revoke LP</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Inventory Value</p>
            <p className="text-lg font-semibold">{formatCurrency(dealer.inventory_value)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Est. Monthly Sales</p>
            <p className="text-lg font-semibold">{formatCurrency(dealer.estimated_monthly_sales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Est. Monthly Revenue</p>
            <p className="text-lg font-semibold">{formatCurrency(monthlyRevenue)}</p>
            <p className="text-xs text-muted-foreground">{dealer.commission_rate}% commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Est. Annual Revenue</p>
            <p className="text-lg font-semibold">{formatCurrency(annualRevenue)}</p>
            {avgWatchPrice != null && (
              <p className="text-xs text-muted-foreground">Avg watch: {formatCurrency(avgWatchPrice)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {dealer.user_id && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Active Listings</p>
              <p className="text-lg font-semibold">{dealer.listings_count ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Actual Monthly GMV</p>
              <p className="text-lg font-semibold">{formatCurrency(dealer.actual_monthly_gmv ?? 0)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <DealerFormDialog open={editOpen} onOpenChange={setEditOpen} adminId={adminId} dealer={dealer} />
    </div>
  );
}
