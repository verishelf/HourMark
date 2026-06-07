import { PageHeader } from "@/components/dashboard/page-header";
import { PushNotificationsPanel } from "@/components/push-notifications/push-notifications-panel";
import { getPushTokenStats } from "@/actions/push-notifications";
import { getPushNotificationCampaigns } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

import type { PushNotificationCampaign } from "@/types/database";

export default async function PushNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [campaigns, stats] = await Promise.all([
    getPushNotificationCampaigns(),
    getPushTokenStats(),
  ]);

  return (
    <div>
      <PageHeader
        title="Push Notifications"
        description="Send push notifications to Crownly iOS and Android app users"
      />
      <PushNotificationsPanel
        campaigns={campaigns as PushNotificationCampaign[]}
        adminId={user?.id ?? ""}
        stats={stats}
      />
    </div>
  );
}
