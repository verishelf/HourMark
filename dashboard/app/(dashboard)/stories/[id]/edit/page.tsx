import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { StoryForm } from "@/components/stories/story-form";
import { getAdminStory, getStoryCategories, getAdminAuthors } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { StoryBlock } from "@/types/database";

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [story, categories, authors] = await Promise.all([
    getAdminStory(id),
    getStoryCategories(),
    getAdminAuthors(),
  ]);

  if (!story) notFound();

  return (
    <div>
      <PageHeader title="Edit Story" description={story.title} />
      <StoryForm
        adminId={user?.id ?? ""}
        categories={categories}
        authors={authors}
        story={{
          id: story.id,
          title: story.title,
          subtitle: story.subtitle,
          hero_image_url: story.hero_image_url,
          body: (story.body ?? []) as StoryBlock[],
          category_id: story.category_id,
          author_id: story.author_id,
          read_time_minutes: story.read_time_minutes,
          source_attribution: story.source_attribution,
          is_featured: story.is_featured,
          scheduled_at: story.scheduled_at,
        }}
      />
    </div>
  );
}
