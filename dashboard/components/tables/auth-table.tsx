"use client";

import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/dashboard/data-table";
import { updateAuthStatus } from "@/actions/authentication";
import type { AuthRequestStatus, AuthenticationRequest } from "@/types/database";

const STATUSES: AuthRequestStatus[] = [
  "awaiting_shipment", "received", "under_inspection", "passed", "failed", "returned", "delivered",
];

const statusVariant: Record<AuthRequestStatus, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  awaiting_shipment: "warning",
  received: "secondary",
  under_inspection: "default",
  passed: "success",
  failed: "destructive",
  returned: "warning",
  delivered: "success",
};

export function AuthTable({ requests, adminId }: { requests: AuthenticationRequest[]; adminId: string }) {
  async function handleStatus(id: string, status: AuthRequestStatus) {
    await updateAuthStatus(adminId, id, status);
    toast.success(`Status updated to ${status.replace("_", " ")}`);
  }

  const columns = [
    { key: "id", header: "Auth ID", cell: (row: AuthenticationRequest) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span> },
    { key: "seller", header: "Seller", cell: (row: AuthenticationRequest) => row.seller?.full_name ?? row.seller?.username ?? "—" },
    { key: "buyer", header: "Buyer", cell: (row: AuthenticationRequest) => row.buyer?.full_name ?? row.buyer?.username ?? "—" },
    { key: "watch", header: "Watch", cell: (row: AuthenticationRequest) => `${row.watch_brand} ${row.watch_model}` },
    { key: "tracking", header: "Tracking #", cell: (row: AuthenticationRequest) => row.tracking_number ?? "—" },
    {
      key: "status",
      header: "Status",
      cell: (row: AuthenticationRequest) => (
        <Badge variant={statusVariant[row.status]}>{row.status.replace(/_/g, " ")}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row: AuthenticationRequest) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => handleStatus(row.id, s)}>
                Set {s.replace(/_/g, " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={requests} />;
}
