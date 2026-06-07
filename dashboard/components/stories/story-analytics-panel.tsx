"use client";

import { Eye, BookOpen, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import type { StoryAnalytics } from "@/types/database";

type TrendingStory = StoryAnalytics["trending"][number];

export function StoryAnalyticsPanel({ analytics }: { analytics: StoryAnalytics }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Views" value={analytics.total_views.toLocaleString()} icon={Eye} />
        <KpiCard title="Completed Reads" value={analytics.total_reads.toLocaleString()} icon={BookOpen} />
        <KpiCard title="Completion Rate" value={`${analytics.completion_rate}%`} icon={TrendingUp} />
        <KpiCard title="Trending Stories" value={String(analytics.trending.length)} icon={BarChart3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Stories by Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.trending.map((s: TrendingStory) => (
              <div key={s.slug} className="flex items-center justify-between border-b border-border pb-2 text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground">{s.view_count} views · score {s.engagement_score}</span>
              </div>
            ))}
            {analytics.trending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published stories yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
