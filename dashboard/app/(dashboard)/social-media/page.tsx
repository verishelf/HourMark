import { PageHeader } from "@/components/dashboard/page-header";
import { SocialPostsPanel } from "@/components/social-media/social-posts-panel";
import {
  getConnectedPlatformStats,
  getSocialChannelCredentials,
  getSocialPosts,
} from "@/actions/social-media";
import { createClient } from "@/lib/supabase/server";
import type { SocialPlatform } from "@/types/social-media";

export default async function SocialMediaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [posts, credentials, stats] = await Promise.all([
    getSocialPosts(),
    getSocialChannelCredentials(),
    getConnectedPlatformStats(),
  ]);

  const enabledPlatforms = credentials
    .filter((c) => c.enabled)
    .map((c) => c.platform as SocialPlatform);

  return (
    <div>
      <PageHeader
        title="Social Media Manager"
        description="Compose once, post or schedule to Instagram, Facebook, X, LinkedIn, and more"
      />
      <SocialPostsPanel
        posts={posts}
        adminId={user?.id ?? ""}
        enabledPlatforms={enabledPlatforms}
        stats={stats}
      />
    </div>
  );
}
