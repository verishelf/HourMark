import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { UsersTable } from "@/components/tables/users-table";
import { getUsers } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const users = await getUsers();

  const exportData = users.map((u) => ({
    id: u.id,
    name: u.full_name ?? u.username,
    email: u.username,
    role: u.admin_role ?? (u.is_verified_seller ? "seller" : "buyer"),
    total_sales: u.total_sales,
    total_purchases: u.total_purchases,
    created_at: u.created_at,
  }));

  return (
    <div>
      <PageHeader
        title="Users Management"
        description="Manage users, roles, and verification status"
        actions={<ExportButtons data={exportData} filename="users" />}
      />
      <UsersTable users={users} adminId={user?.id ?? ""} />
    </div>
  );
}
