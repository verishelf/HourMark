import { PageHeader } from "@/components/dashboard/page-header";
import { CampaignsTable } from "@/components/tables/campaigns-table";
import { WebsiteSignupsPanel } from "@/components/campaigns/website-signups-panel";
import { ensureDefaultEmailTemplates } from "@/actions/email-templates";
import { getEmailCampaigns, getEmailCampaignTemplates, getWebsiteSignups } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    await ensureDefaultEmailTemplates(user.id);
  }

  const [campaigns, templates, signups] = await Promise.all([
    getEmailCampaigns(),
    getEmailCampaignTemplates(),
    getWebsiteSignups(),
  ]);

  return (
    <div>
      <PageHeader
        title="Email Campaign Center"
        description="Create campaigns, save reusable HTML templates, and preview before sending"
      />
      <WebsiteSignupsPanel signups={signups} />
      <CampaignsTable
        campaigns={campaigns}
        templates={templates}
        adminId={user?.id ?? ""}
      />
    </div>
  );
}
