"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteStory, featureStory, publishStory } from "@/actions/stories";
import { formatDate } from "@/lib/utils";

type StoryRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  published_at: string | null;
  category?: { name: string } | null;
};

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  published: "success",
  draft: "secondary",
  scheduled: "warning",
  archived: "destructive",
};

export function StoriesTable({ stories, adminId }: { stories: StoryRow[]; adminId: string }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () => stories.filter((s) => statusFilter === "all" || s.status === statusFilter),
    [stories, statusFilter]
  );

  async function handleAction(action: string, storyId: string) {
    try {
      if (action === "publish") await publishStory(adminId, storyId);
      else if (action === "feature") await featureStory(adminId, storyId, true);
      else if (action === "unfeature") await featureStory(adminId, storyId, false);
      else if (action === "delete") await deleteStory(adminId, storyId);
      else return;
      toast.success("Story updated");
      router.refresh();
    } catch {
      toast.error("Action failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <Button asChild>
          <Link href="/stories/new">
            <Plus className="mr-2 h-4 w-4" />
            New Story
          </Link>
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (row) => (
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.category?.name}</p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <Badge variant={statusVariant[row.status] ?? "secondary"}>{row.status}</Badge>,
          },
          {
            key: "featured",
            header: "Featured",
            cell: (row) => (row.is_featured ? <Badge variant="default">Yes</Badge> : "—"),
          },
          {
            key: "views",
            header: "Views",
            cell: (row) => row.view_count,
          },
          {
            key: "engagement",
            header: "Likes",
            cell: (row) => row.like_count,
          },
          {
            key: "published",
            header: "Published",
            cell: (row) => (row.published_at ? formatDate(row.published_at) : "—"),
          },
          {
            key: "actions",
            header: "",
            cell: (row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/stories/${row.id}/edit`}>Edit</Link>
                  </DropdownMenuItem>
                  {row.status !== "published" ? (
                    <DropdownMenuItem onClick={() => handleAction("publish", row.id)}>Publish</DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => handleAction(row.is_featured ? "unfeature" : "feature", row.id)}>
                    {row.is_featured ? "Unfeature" : "Feature"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleAction("delete", row.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />
    </div>
  );
}
