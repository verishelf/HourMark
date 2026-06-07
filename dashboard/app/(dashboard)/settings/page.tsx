import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/settings-form";
import { getPlatformSettings } from "@/lib/queries";
import { getSocialChannelCredentials } from "@/actions/social-media";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tab } = await searchParams;
  const [settings, socialCredentials] = await Promise.all([
    getPlatformSettings(),
    getSocialChannelCredentials(),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Manage platform configuration and fees" />
      <SettingsForm
        settings={settings}
        adminId={user?.id ?? ""}
        socialCredentials={socialCredentials}
        initialTab={tab}
      />
    </div>
  );
}
