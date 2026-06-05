import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRevenueMetrics } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

export default async function RevenuePage() {
  const metrics = await getRevenueMetrics();

  return (
    <div>
      <PageHeader title="Revenue Center" description="Marketplace revenue analytics and breakdowns" />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <KpiCard title="Gross Marketplace Volume" value={formatCurrency(metrics.grossVolume)} icon={DollarSign} />
        <KpiCard title="Crownly Revenue" value={formatCurrency(metrics.crownlyRevenue)} icon={TrendingUp} />
        <KpiCard title="Monthly Revenue" value={formatCurrency(metrics.monthlyRevenue)} icon={Calendar} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <ChartCard title="Revenue Growth" data={metrics.revenueGrowth} valueFormat="currency" />
        <ChartCard title="Transaction Volume" data={metrics.transactionVolume} valueFormat="currency" type="bar" />
        <ChartCard title="Top Selling Brands" data={metrics.topBrands} valueFormat="currency" type="bar" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue by Brand</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.revenueByBrand.map((item) => (
                <div key={item.brand} className="flex justify-between text-sm">
                  <span>{item.brand}</span>
                  <span className="font-medium">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
              {metrics.revenueByBrand.length === 0 && (
                <p className="text-muted-foreground text-sm">No revenue data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue by Seller</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.revenueBySeller.map((item) => (
                <div key={item.sellerId} className="flex justify-between text-sm">
                  <span className="font-mono text-xs">{item.sellerId.slice(0, 8)}</span>
                  <span className="font-medium">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
              {metrics.revenueBySeller.length === 0 && (
                <p className="text-muted-foreground text-sm">No seller revenue data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
