import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { LeadsTable } from "@/components/tables/leads-table";
import { getSellerLeads } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const leads = await getSellerLeads();

  return (
    <div>
      <PageHeader
        title="Seller Lead CRM"
        description="Track and manage inbound seller leads"
        actions={<ExportButtons data={leads as unknown as Record<string, unknown>[]} filename="seller-leads" />}
      />
      <LeadsTable leads={leads} adminId={user?.id ?? ""} />
    </div>
  );
}
