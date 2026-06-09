import Link from "next/link";
import { Plug, Store } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export default function IntegrationsPage() {
  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Monitor third-party connections across Crownly"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/integrations/shopify"
          className="rounded-lg border border-border p-6 hover:border-foreground/20 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <Store className="h-5 w-5" />
            <h2 className="font-semibold">Shopify</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connected dealer stores, inventory sync logs, and integration health.
          </p>
          <Button variant="outline" size="sm" asChild>
            <span>Open dashboard</span>
          </Button>
        </Link>

        <div className="rounded-lg border border-dashed border-border p-6 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <Plug className="h-5 w-5" />
            <h2 className="font-semibold">More integrations</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Additional marketplace connectors will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
