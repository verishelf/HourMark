import Link from "next/link";
import { BarChart3, Kanban, Upload, Building2, Rocket, Store, Watch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DealersTable } from "@/components/dealers/dealers-table";
import { getDealers, getDealerFilterOptions, getAdminProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { AdminRole } from "@/types/database";

export default async function DealersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ dealers }, filterOptions, profile] = await Promise.all([
    getDealers({ limit: 100 }),
    getDealerFilterOptions(),
    user ? getAdminProfile(user.id) : null,
  ]);

  const totalInventory = dealers.reduce((s, d) => s + d.inventory_value, 0);
  const launchPartners = dealers.filter((d) => d.is_launch_partner).length;
  const activeSellers = dealers.filter((d) =>
    ["active_seller", "top_seller"].includes(d.pipeline_status)
  ).length;

  return (
    <div>
      <PageHeader
        title="Dealer CRM"
        description="Acquire, onboard, and convert luxury watch dealers"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dealers/pipeline">
                <Kanban className="h-4 w-4 mr-2" />
                Pipeline
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dealers/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dealers/import">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <KpiCard title="Total Dealers" value={dealers.length.toLocaleString()} icon={Building2} />
        <KpiCard title="Launch Partners" value={launchPartners.toLocaleString()} icon={Rocket} />
        <KpiCard title="Active Sellers" value={activeSellers.toLocaleString()} icon={Store} />
        <KpiCard title="Total Inventory" value={formatCurrency(totalInventory)} icon={Watch} />
      </div>

      <DealersTable
        dealers={dealers}
        adminId={user?.id ?? ""}
        adminRole={(profile?.admin_role as AdminRole) ?? null}
        countries={filterOptions.countries}
        cities={filterOptions.cities}
      />
    </div>
  );
}
