import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { AuditLogsTable } from "@/components/tables/audit-logs-table";
import { getAuditLogs } from "@/lib/queries";

export default async function AuditLogsPage() {
  const logs = await getAuditLogs();

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
      <AuditLogsTable logs={logs} />
    </div>
  );
}
