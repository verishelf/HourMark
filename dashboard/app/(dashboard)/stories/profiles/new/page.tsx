import { PageHeader } from "@/components/dashboard/page-header";
import { CelebrityProfileForm } from "@/components/stories/celebrity-profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewCelebrityProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <PageHeader title="New Celebrity Profile" />
      <CelebrityProfileForm adminId={user?.id ?? ""} />
    </div>
  );
}
