import {
  Users,
  Store,
  ShoppingBag,
  Watch,
  Clock,
  ShieldCheck,
  CheckCircle,
  DollarSign,
  Calendar,
  Headphones,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDashboardKPIs, getDashboardCharts } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [kpis, charts] = await Promise.all([getDashboardKPIs(), getDashboardCharts()]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of Crownly marketplace performance"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <KpiCard title="Total Users" value={kpis.totalUsers.toLocaleString()} icon={Users} />
        <KpiCard title="Active Sellers" value={kpis.activeSellers.toLocaleString()} icon={Store} />
        <KpiCard title="Active Buyers" value={kpis.activeBuyers.toLocaleString()} icon={ShoppingBag} />
        <KpiCard title="Total Listings" value={kpis.totalListings.toLocaleString()} icon={Watch} />
        <KpiCard title="Pending Listings" value={kpis.pendingListings.toLocaleString()} icon={Clock} />
        <KpiCard title="Pending Auth" value={kpis.pendingAuthRequests.toLocaleString()} icon={ShieldCheck} />
        <KpiCard title="Completed Sales" value={kpis.completedSales.toLocaleString()} icon={CheckCircle} />
        <KpiCard title="Total Revenue" value={formatCurrency(kpis.totalRevenue)} icon={DollarSign} />
        <KpiCard title="Monthly Revenue" value={formatCurrency(kpis.monthlyRevenue)} icon={Calendar} />
        <KpiCard title="Open Tickets" value={kpis.openSupportTickets.toLocaleString()} icon={Headphones} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily Revenue" data={charts.dailyRevenue} valueFormat="currency" />
        <ChartCard title="Listings Created" data={charts.listingsCreated} type="bar" />
        <ChartCard title="User Growth" data={charts.userGrowth} type="line" />
        <ChartCard title="Sales Volume" data={charts.salesVolume} valueFormat="currency" />
        <ChartCard title="Authentication Volume" data={charts.authVolume} type="bar" />
      </div>
    </div>
  );
}
