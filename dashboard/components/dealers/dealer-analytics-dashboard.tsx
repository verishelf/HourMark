"use client";

import {
  Users,
  UserPlus,
  MessageSquare,
  Calendar,
  FileCheck,
  Rocket,
  Store,
  Trophy,
  DollarSign,
  Watch,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { formatCurrency } from "@/lib/utils";
import { PIPELINE_LABELS } from "@/lib/dealer-scoring";
import type { DealerAnalytics } from "@/types/database";

export function DealerAnalyticsDashboard({ analytics }: { analytics: DealerAnalytics }) {
  const funnelData = analytics.conversionFunnel.map((p) => ({
    ...p,
    label: PIPELINE_LABELS[p.date] ?? p.date,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Pipeline Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Leads" value={analytics.totalLeads.toLocaleString()} icon={Users} />
          <KpiCard title="New This Month" value={analytics.newLeadsThisMonth.toLocaleString()} icon={UserPlus} />
          <KpiCard title="Active Conversations" value={analytics.activeConversations.toLocaleString()} icon={MessageSquare} />
          <KpiCard title="Meetings Scheduled" value={analytics.meetingsScheduled.toLocaleString()} icon={Calendar} />
          <KpiCard title="Signed Dealers" value={analytics.signedDealers.toLocaleString()} icon={FileCheck} />
          <KpiCard title="Launch Partners" value={analytics.launchPartners.toLocaleString()} icon={Rocket} />
          <KpiCard title="Active Sellers" value={analytics.activeSellers.toLocaleString()} icon={Store} />
          <KpiCard title="Top Sellers" value={analytics.topSellers.toLocaleString()} icon={Trophy} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Financial Forecast</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KpiCard title="Total Inventory" value={formatCurrency(analytics.totalInventoryValue)} icon={Watch} />
          <KpiCard title="Total Watches" value={analytics.totalWatches.toLocaleString()} icon={Watch} />
          <KpiCard title="Est. Monthly GMV" value={formatCurrency(analytics.estimatedMonthlyGmv)} icon={TrendingUp} />
          <KpiCard title="Est. Annual GMV" value={formatCurrency(analytics.estimatedAnnualGmv)} icon={TrendingUp} />
          <KpiCard title="Est. Annual Revenue" value={formatCurrency(analytics.estimatedAnnualRevenue)} icon={DollarSign} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Dealer Growth" data={analytics.dealerGrowth} type="bar" />
        <ChartCard title="Conversion Funnel" data={funnelData} type="bar" />
        <ChartCard title="Inventory Growth" data={analytics.inventoryGrowth} valueFormat="currency" />
        <ChartCard title="Revenue Forecast" data={analytics.revenueForecast} valueFormat="currency" />
        <div className="lg:col-span-2">
          <ChartCard title="Dealer Locations" data={analytics.dealerLocations} type="bar" />
        </div>
      </div>
    </div>
  );
}
