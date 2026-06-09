import Link from "next/link";
import { ArrowLeft, Store, Watch, AlertTriangle, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ShopifyDashboard } from "@/components/integrations/shopify-dashboard";
import { Button } from "@/components/ui/button";
import {
  getShopifyIntegrationStats,
  getShopifyStores,
  getShopifySyncLogs,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";

export default async function ShopifyIntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [stats, stores, logs] = await Promise.all([
    getShopifyIntegrationStats(),
    getShopifyStores(),
    getShopifySyncLogs(),
  ]);

  return (
    <div>
      <PageHeader
        title="Shopify Integration"
        description="Monitor connected stores, sync health, and imported listings. Sellers connect Shopify from the mobile app."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/integrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All integrations
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <KpiCard title="Connected Stores" value={stats.connectedStores.toLocaleString()} icon={Store} />
        <KpiCard title="Connected Dealers" value={stats.connectedDealers.toLocaleString()} icon={Store} />
        <KpiCard title="Imported Listings" value={stats.totalImportedListings.toLocaleString()} icon={Watch} />
        <KpiCard title="Failed Syncs (24h)" value={stats.failedSyncs24h.toLocaleString()} icon={AlertTriangle} />
      </div>

      {stats.lastSyncAt ? (
        <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Last sync {formatDistanceToNow(new Date(stats.lastSyncAt), { addSuffix: true })}
        </p>
      ) : null}

      <ShopifyDashboard stores={stores} logs={logs} adminId={user?.id ?? ""} />
    </div>
  );
}
