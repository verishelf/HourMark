import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StoriesTable } from "@/components/stories/stories-table";
import { getAdminStories } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function StoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const stories = await getAdminStories();

  return (
    <div>
      <PageHeader
        title="Crownly Stories"
        description="Create, edit, and manage editorial content"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/stories/submissions">Submissions</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/stories/analytics">Analytics</Link>
            </Button>
          </div>
        }
      />
      <StoriesTable stories={stories} adminId={user?.id ?? ""} />
    </div>
  );
}
