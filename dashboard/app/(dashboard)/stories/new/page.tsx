import { PageHeader } from "@/components/dashboard/page-header";
import { StoryForm } from "@/components/stories/story-form";
import { getStoryCategories, getAdminAuthors } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function NewStoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [categories, authors] = await Promise.all([getStoryCategories(), getAdminAuthors()]);

  return (
    <div>
      <PageHeader title="New Story" description="Create a Crownly Stories article" />
      <StoryForm adminId={user?.id ?? ""} categories={categories} authors={authors} />
    </div>
  );
}
