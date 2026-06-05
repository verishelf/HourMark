import { PageHeader } from "@/components/dashboard/page-header";
import { SupportTable } from "@/components/tables/support-table";
import { getSupportTickets } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tickets = await getSupportTickets();

  return (
    <div>
      <PageHeader title="Support Center" description="Manage support tickets and customer inquiries" />
      <SupportTable tickets={tickets} adminId={user?.id ?? ""} />
    </div>
  );
}
