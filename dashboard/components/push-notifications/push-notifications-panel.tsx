"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MoreHorizontal, Plus, Send, Smartphone, Trash2 } from "lucide-react";
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
  PushNotificationFormFields,
  PUSH_AUDIENCE_LABELS,
  type PushNotificationFormState,
} from "@/components/push-notifications/push-notification-form-fields";
import {
  createPushNotificationCampaign,
  deletePushNotificationCampaign,
  sendPushNotificationCampaign,
  sendTestPushNotification,
} from "@/actions/push-notifications";
import { formatDate } from "@/lib/utils";
import type { PushNotificationCampaign } from "@/types/database";

const EMPTY_FORM: PushNotificationFormState = {
  title: "",
  body: "",
  audience: "all",
  deep_link: "",
};

const statusVariant: Record<string, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  sent: "success",
  draft: "secondary",
  scheduled: "warning",
  sending: "default",
  cancelled: "destructive",
};

export function PushNotificationsPanel({
  campaigns,
  adminId,
  stats,
}: {
  campaigns: PushNotificationCampaign[];
  adminId: string;
  stats: { totalTokens: number; ios: number; android: number };
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PushNotificationCampaign | null>(null);
  const [form, setForm] = useState<PushNotificationFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function handleCreate(sendNow = false) {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSaving(true);
    try {
      const result = await createPushNotificationCampaign(adminId, {
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        deep_link: form.deep_link.trim() || null,
      });
      if (result.error) throw new Error(result.error);

      if (sendNow && result.id) {
        const sendResult = await sendPushNotificationCampaign(adminId, result.id);
        if (sendResult.error) throw new Error(sendResult.error);
        if (sendResult.warning) toast.warning(sendResult.warning);
        else toast.success(`Sent to ${sendResult.recipientCount ?? 0} devices`);
      } else {
        toast.success("Push campaign saved as draft");
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

  async function handleSend(campaignId: string) {
    try {
      const result = await sendPushNotificationCampaign(adminId, campaignId);
      if (result.error) throw new Error(result.error);
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Delivered to ${result.successCount ?? 0} devices`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    }
  }

  async function handleTestPush() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Enter title and message first");
      return;
    }
    try {
      const result = await sendTestPushNotification(adminId, {
        title: form.title.trim(),
        body: form.body.trim(),
        deep_link: form.deep_link.trim() || null,
      });
      if (result.error) throw new Error(result.error);
      toast.success("Test push sent to your device");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deletePushNotificationCampaign(adminId, deleteTarget.id);
      if (result.error) throw new Error(result.error);
      toast.success("Campaign deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Registered devices" value={stats.totalTokens} icon={Smartphone} />
        <KpiCard title="iOS tokens" value={stats.ios} icon={Bell} />
        <KpiCard title="Android tokens" value={stats.android} icon={Bell} />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New push notification
        </Button>
      </div>

      <DataTable
        data={campaigns}
        emptyMessage="No push campaigns yet. Create one to reach app users."
        columns={[
          {
            key: "title",
            header: "Notification",
            cell: (row) => (
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{row.body}</p>
              </div>
            ),
          },
          {
            key: "audience",
            header: "Audience",
            cell: (row) => PUSH_AUDIENCE_LABELS[row.audience],
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <Badge variant={statusVariant[row.status] ?? "secondary"}>{row.status}</Badge>,
          },
          {
            key: "stats",
            header: "Delivery",
            cell: (row) =>
              row.status === "sent"
                ? `${row.success_count}/${row.recipient_count} ok`
                : "—",
          },
          {
            key: "date",
            header: "Created",
            cell: (row) => formatDate(row.created_at),
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
                  {row.status === "draft" || row.status === "scheduled" ? (
                    <DropdownMenuItem onClick={() => handleSend(row.id)}>
                      <Send className="mr-2 h-4 w-4" />
                      Send now
                    </DropdownMenuItem>
                  ) : null}
                  {row.status !== "sending" ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(row)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create push notification</DialogTitle>
            <DialogDescription>
              Send a push to Crownly app users via Expo. Also creates an in-app notification.
            </DialogDescription>
          </DialogHeader>
          <PushNotificationFormFields form={form} onChange={setForm} />
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={handleTestPush}>
              Send test to me
            </Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => handleCreate(false)}>
              Save draft
            </Button>
            <Button type="button" disabled={saving} onClick={() => handleCreate(true)}>
              {saving ? "Sending…" : "Send now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete campaign?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
