"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/types/database";

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  const columns = [
    {
      key: "admin",
      header: "Admin",
      cell: (row: AuditLog) => row.admin?.full_name ?? row.admin?.username ?? "—",
    },
    {
      key: "action",
      header: "Action",
      cell: (row: AuditLog) => <Badge variant="secondary">{row.action.replace(/_/g, " ")}</Badge>,
    },
    { key: "resource", header: "Resource", cell: (row: AuditLog) => row.resource_type },
    {
      key: "resource_id",
      header: "Resource ID",
      cell: (row: AuditLog) =>
        row.resource_id ? <span className="font-mono text-xs">{row.resource_id.slice(0, 8)}</span> : "—",
    },
    {
      key: "date",
      header: "Timestamp",
      cell: (row: AuditLog) => formatDateTime(row.created_at),
    },
  ];

  return <DataTable columns={columns} data={logs} />;
}
