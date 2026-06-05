import { PageHeader } from "@/components/dashboard/page-header";
import { CampaignsTable } from "@/components/tables/campaigns-table";
import { getEmailCampaigns } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const campaigns = await getEmailCampaigns();

  return (
    <div>
      <PageHeader
        title="Email Campaign Center"
        description="Create and manage email campaigns with Resend"
      />
      <CampaignsTable campaigns={campaigns} adminId={user?.id ?? ""} />
    </div>
  );
}
