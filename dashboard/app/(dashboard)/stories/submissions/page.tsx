import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SubmissionsTable } from "@/components/stories/submissions-table";
import { getStorySubmissions } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function StorySubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const submissions = await getStorySubmissions();

  return (
    <div>
      <PageHeader
        title="Collector Submissions"
        description="Review and approve user-submitted stories"
        actions={
          <Button variant="outline" asChild>
            <Link href="/stories">Back to Stories</Link>
          </Button>
        }
      />
      <SubmissionsTable submissions={submissions} adminId={user?.id ?? ""} />
    </div>
  );
}
