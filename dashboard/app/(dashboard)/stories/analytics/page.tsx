import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StoryAnalyticsPanel } from "@/components/stories/story-analytics-panel";
import { getStoryAnalytics } from "@/actions/stories";
import { Button } from "@/components/ui/button";

export default async function StoryAnalyticsPage() {
  const analytics = await getStoryAnalytics();

  return (
    <div>
      <PageHeader
        title="Story Analytics"
        description="Views, reads, and trending content"
        actions={
          <Button variant="outline" asChild>
            <Link href="/stories">Back to Stories</Link>
          </Button>
        }
      />
      <StoryAnalyticsPanel analytics={analytics} />
    </div>
  );
}
