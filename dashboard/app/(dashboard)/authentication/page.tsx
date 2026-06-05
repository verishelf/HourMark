import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { AuthTable } from "@/components/tables/auth-table";
import { getAuthenticationRequests } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const requests = await getAuthenticationRequests();

  return (
    <div>
      <PageHeader
        title="Authentication Management"
        description="Track and manage watch authentication requests"
        actions={<ExportButtons data={requests as unknown as Record<string, unknown>[]} filename="authentication" />}
      />
      <AuthTable requests={requests} adminId={user?.id ?? ""} />
    </div>
  );
}
