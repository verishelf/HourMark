import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { getAuditLogs } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/types/database";

export default async function AuditLogsPage() {
  const logs = await getAuditLogs();

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

  const exportData = logs.map((l) => ({
    admin: l.admin?.full_name,
    action: l.action,
    resource_type: l.resource_type,
    resource_id: l.resource_id,
    created_at: l.created_at,
  }));

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track all admin actions and system changes"
        actions={<ExportButtons data={exportData} filename="audit-logs" />}
      />
      <DataTable columns={columns} data={logs} />
    </div>
  );
}
