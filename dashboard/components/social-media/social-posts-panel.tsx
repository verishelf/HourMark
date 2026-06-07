"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MoreHorizontal, Plus, Send, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/dashboard/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  SocialPostFormFields,
  type SocialPostFormState,
} from "@/components/social-media/social-post-form-fields";
import {
  createSocialPost,
  deleteSocialPost,
  publishDueSocialPosts,
  publishSocialPost,
} from "@/actions/social-media";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/social-platforms";
import { formatDate } from "@/lib/utils";
import type { SocialPlatform, SocialPost } from "@/types/social-media";

const EMPTY_FORM: SocialPostFormState = {
  content: "",
  platforms: [],
  media_urls: [],
  scheduled_at: "",
  schedule_enabled: false,
};

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  published: "success",
  partial: "warning",
  draft: "secondary",
  scheduled: "warning",
  publishing: "default",
  failed: "destructive",
  cancelled: "destructive",
};

export function SocialPostsPanel({
  posts,
  adminId,
  enabledPlatforms,
  stats,
}: {
  posts: SocialPost[];
  adminId: string;
  enabledPlatforms: SocialPlatform[];
  stats: { totalPlatforms: number; connected: number; configured: number };
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SocialPost | null>(null);
  const [form, setForm] = useState<SocialPostFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function handleCreate(publishNow = false) {
    if (!form.content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (form.platforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    setSaving(true);
    try {
      const scheduledAt =
        form.schedule_enabled && form.scheduled_at && !publishNow
          ? new Date(form.scheduled_at).toISOString()
          : null;

      const result = await createSocialPost(adminId, {
        content: form.content.trim(),
        media_urls: form.media_urls,
        platforms: form.platforms,
        scheduled_at: scheduledAt,
      });
      if (result.error) throw new Error(result.error);

      if (publishNow && result.id) {
        const pub = await publishSocialPost(adminId, result.id);
        if (pub.error && !pub.successCount) throw new Error(pub.error);
        toast.success(`Published to ${pub.successCount}/${pub.total} platforms`);
      } else if (scheduledAt) {
        toast.success("Post scheduled");
      } else {
        toast.success("Draft saved");
      }

      setCreateOpen(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(postId: string) {
    try {
      const result = await publishSocialPost(adminId, postId);
      if (result.error && !result.successCount) throw new Error(result.error);
      toast.success(`Published to ${result.successCount}/${result.total} platforms`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    }
  }

  async function handlePublishDue() {
    try {
      const result = await publishDueSocialPosts(adminId);
      toast.success(`Published ${result.published} scheduled post(s)`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteSocialPost(adminId, deleteTarget.id);
      if (result.error) throw new Error(result.error);
      toast.success("Post deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const columns = [
    {
      key: "content",
      header: "Post",
      cell: (row: SocialPost) => (
        <div className="max-w-md">
          <p className="line-clamp-2 text-sm">{row.content}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {row.platforms.map((p) => (
              <Badge key={p} variant="outline" className="text-[10px]">
                {SOCIAL_PLATFORM_LABELS[p]}
              </Badge>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: SocialPost) => (
        <Badge variant={statusVariant[row.status] ?? "secondary"}>{row.status}</Badge>
      ),
    },
    {
      key: "scheduled_at",
      header: "Schedule",
      cell: (row: SocialPost) =>
        row.scheduled_at ? formatDate(row.scheduled_at) : row.published_at ? formatDate(row.published_at) : "—",
    },
    {
      key: "actions",
      header: "",
      cell: (row: SocialPost) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["draft", "scheduled", "failed", "partial"].includes(row.status) ? (
              <DropdownMenuItem onClick={() => void handlePublish(row.id)}>
                <Send className="mr-2 h-4 w-4" />
                Publish now
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Connected channels" value={`${stats.connected}/${stats.totalPlatforms}`} icon={Send} />
        <KpiCard title="Total posts" value={String(posts.length)} icon={Calendar} />
        <KpiCard
          title="API keys configured"
          value={String(stats.configured)}
          icon={Settings}
          subtitle={stats.connected === 0 ? "Add keys in Settings" : undefined}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Compose post
        </Button>
        <Button variant="outline" onClick={() => void handlePublishDue()}>
          Publish due scheduled posts
        </Button>
        <Button variant="outline" asChild>
          <Link href="/settings?tab=social">
            <Settings className="mr-2 h-4 w-4" />
            API keys
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={posts} emptyMessage="No social posts yet. Compose your first post." />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose social post</DialogTitle>
            <DialogDescription>
              Write once and publish to Instagram, Facebook, X, LinkedIn, and more.
            </DialogDescription>
          </DialogHeader>
          <SocialPostFormFields form={form} onChange={setForm} enabledPlatforms={enabledPlatforms} />
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" disabled={saving} onClick={() => void handleCreate(false)}>
              {form.schedule_enabled ? "Schedule" : "Save draft"}
            </Button>
            <Button disabled={saving} onClick={() => void handleCreate(true)}>
              Post now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
