"use client";

import { useTransition } from "react";
import Link from "next/link";
import { RefreshCw, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminDisableShopifyIntegration,
  adminEnableShopifyIntegration,
  adminForceShopifySync,
} from "@/actions/shopify";
import type { DealerShopifyStore, ShopifySyncLog } from "@/types/database";
import { formatDistanceToNow } from "date-fns";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "success" || status === "idle") return "secondary";
  if (status === "error" || status === "disabled") return "destructive";
  if (status === "syncing") return "default";
  return "outline";
}

export function ShopifyDashboard({
  stores,
  logs,
  adminId,
}: {
  stores: DealerShopifyStore[];
  logs: ShopifySyncLog[];
  adminId: string;
}) {
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ error?: string; success?: boolean }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.error) alert(result.error);
    });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Dealer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Imported</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center py-8">
                  No Shopify stores connected yet.
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="font-medium">{store.shop_name ?? store.shop_domain}</div>
                    <div className="text-xs text-muted-foreground">{store.shop_domain}</div>
                  </TableCell>
                  <TableCell>
                    <div>{store.dealer?.company_name ?? "—"}</div>
                    <Link
                      href={`/dealers/${store.dealer_id}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      View dealer
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(store.sync_status)}>{store.sync_status}</Badge>
                    {!store.integration_enabled ? (
                      <Badge variant="destructive" className="ml-1">
                        disabled
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{store.products_imported}</TableCell>
                  <TableCell>
                    {store.last_sync
                      ? formatDistanceToNow(new Date(store.last_sync), { addSuffix: true })
                      : "—"}
                  </TableCell>
                  <TableCell>{(store.seller_fee_rate * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending || !store.integration_enabled}
                      onClick={() => run(() => adminForceShopifySync(adminId, store.id))}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Re-sync
                    </Button>
                    {store.integration_enabled ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => run(() => adminDisableShopifyIntegration(adminId, store.id))}
                      >
                        <PowerOff className="h-3.5 w-3.5 mr-1" />
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => run(() => adminEnableShopifyIntegration(adminId, store.id))}
                      >
                        <Power className="h-3.5 w-3.5 mr-1" />
                        Enable
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Recent sync activity</h3>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Dealer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No sync logs yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.slice(0, 25).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>{log.dealer?.company_name ?? log.dealer_id.slice(0, 8)}</TableCell>
                    <TableCell>{log.sync_type}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      +{log.products_created} / ~{log.products_updated} / −{log.products_deleted}
                    </TableCell>
                    <TableCell className="text-sm text-destructive max-w-xs truncate">
                      {log.error_message ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
