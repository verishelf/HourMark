import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getAnalytics } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import {
  Percent,
  Watch,
  DollarSign,
  Users,
  ShieldCheck,
  UserCheck,
  Store,
} from "lucide-react";

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  const exportData = [
    { metric: "Conversion Rate", value: `${analytics.conversionRate.toFixed(1)}%` },
    { metric: "Listings Per Seller", value: analytics.listingsPerSeller.toFixed(1) },
    { metric: "Average Sale Price", value: formatCurrency(analytics.averageSalePrice) },
    { metric: "Revenue Per User", value: formatCurrency(analytics.revenuePerUser) },
    { metric: "Authentication Success Rate", value: `${analytics.authenticationSuccessRate.toFixed(1)}%` },
    { metric: "Buyer Retention", value: `${analytics.buyerRetention.toFixed(1)}%` },
    { metric: "Seller Retention", value: `${analytics.sellerRetention.toFixed(1)}%` },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Marketplace performance metrics and retention analysis"
        actions={<ExportButtons data={exportData} filename="analytics" />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard title="Conversion Rate" value={`${analytics.conversionRate.toFixed(1)}%`} icon={Percent} subtitle="Listings to sales" />
        <KpiCard title="Listings Per Seller" value={analytics.listingsPerSeller.toFixed(1)} icon={Watch} />
        <KpiCard title="Average Sale Price" value={formatCurrency(analytics.averageSalePrice)} icon={DollarSign} />
        <KpiCard title="Revenue Per User" value={formatCurrency(analytics.revenuePerUser)} icon={Users} />
        <KpiCard title="Auth Success Rate" value={`${analytics.authenticationSuccessRate.toFixed(1)}%`} icon={ShieldCheck} />
        <KpiCard title="Buyer Retention" value={`${analytics.buyerRetention.toFixed(1)}%`} icon={UserCheck} />
        <KpiCard title="Seller Retention" value={`${analytics.sellerRetention.toFixed(1)}%`} icon={Store} />
        <KpiCard title="Total Orders" value={analytics.totalOrders} icon={DollarSign} subtitle={`${analytics.completedOrders} completed`} />
      </div>
    </div>
  );
}
