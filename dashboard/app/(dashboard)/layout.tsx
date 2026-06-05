import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { AdminRole } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let fullName = "Admin";
  let role: AdminRole | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, username, admin_role")
      .eq("id", user.id)
      .single();

    fullName = profile?.full_name ?? profile?.username ?? user.email ?? "Admin";
    role = (profile?.admin_role as AdminRole) ?? null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} />
      <div className="pl-64">
        <Header userName={fullName} role={role} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
