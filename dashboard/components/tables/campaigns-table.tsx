"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Send, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/dashboard/data-table";
import {
  createCampaign,
  deleteCampaign,
  sendCampaign,
  sendTestEmail,
  updateCampaign,
} from "@/actions/campaigns";
import { formatDate } from "@/lib/utils";
import type { CampaignAudience, EmailCampaign } from "@/types/database";

type CampaignForm = {
  subject: string;
  template_html: string;
  audience: CampaignAudience;
  testEmail: string;
};

const EMPTY_FORM: CampaignForm = {
  subject: "",
  template_html: "",
  audience: "all",
  testEmail: "",
};

function canEditCampaign(status: EmailCampaign["status"]) {
  return status === "draft" || status === "scheduled" || status === "cancelled";
}

function canDeleteCampaign(status: EmailCampaign["status"]) {
  return status !== "sending";
}

export function CampaignsTable({ campaigns, adminId }: { campaigns: EmailCampaign[]; adminId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<EmailCampaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailCampaign | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function openCreateDialog() {
    resetForm();
    setCreateOpen(true);
  }

  function openEditDialog(campaign: EmailCampaign) {
    setForm({
      subject: campaign.subject,
      template_html: campaign.template_html,
      audience: campaign.audience,
      testEmail: "",
    });
    setEditCampaign(campaign);
  }

  async function handleCreate() {
    const result = await createCampaign(adminId, {
      subject: form.subject,
      template_html: form.template_html,
      audience: form.audience,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Campaign created");
    setCreateOpen(false);
    resetForm();
  }

  async function handleUpdate() {
    if (!editCampaign) return;
    const result = await updateCampaign(adminId, editCampaign.id, {
      subject: form.subject,
      template_html: form.template_html,
      audience: form.audience,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Campaign updated");
    setEditCampaign(null);
    resetForm();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteCampaign(adminId, deleteTarget.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Campaign deleted");
    setDeleteTarget(null);
  }

  async function handleSend(campaignId: string) {
    const result = await sendCampaign(adminId, campaignId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Campaign sent to ${result.sent ?? 0} recipient(s)`);
  }

  async function handleTest() {
    if (!form.testEmail.trim()) {
      toast.error("Enter a test email address.");
      return;
    }
    if (!form.subject.trim() || !form.template_html.trim()) {
      toast.error("Subject and HTML template are required.");
      return;
    }
    const result = await sendTestEmail(adminId, form.testEmail, form.subject, form.template_html);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Test email sent");
  }

  function renderCampaignForm(onSubmit: () => void, submitLabel: string) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Subject</Label>
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <Label>Audience</Label>
          <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v as CampaignAudience })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="sellers">Sellers</SelectItem>
              <SelectItem value="buyers">Buyers</SelectItem>
              <SelectItem value="dealers">Dealers</SelectItem>
              <SelectItem value="new_leads">New Leads</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Email Template (HTML)</Label>
          <Textarea value={form.template_html} onChange={(e) => setForm({ ...form, template_html: e.target.value })} rows={12} />
        </div>
        <div className="flex gap-2">
          <Input placeholder="Test email address" value={form.testEmail} onChange={(e) => setForm({ ...form, testEmail: e.target.value })} />
          <Button variant="outline" onClick={handleTest}>Send Test</Button>
        </div>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    );
  }

  const columns = [
    { key: "subject", header: "Subject", cell: (row: EmailCampaign) => row.subject },
    { key: "audience", header: "Audience", cell: (row: EmailCampaign) => <Badge variant="secondary">{row.audience}</Badge> },
    { key: "status", header: "Status", cell: (row: EmailCampaign) => <Badge>{row.status}</Badge> },
    { key: "opens", header: "Opens", cell: (row: EmailCampaign) => row.open_count },
    { key: "clicks", header: "Clicks", cell: (row: EmailCampaign) => row.click_count },
    { key: "replies", header: "Replies", cell: (row: EmailCampaign) => row.reply_count },
    { key: "created", header: "Created", cell: (row: EmailCampaign) => formatDate(row.created_at) },
    {
      key: "actions",
      header: "",
      cell: (row: EmailCampaign) => (
        <div className="flex items-center gap-2">
          {(row.status === "draft" || row.status === "scheduled") && (
            <Button size="sm" variant="outline" onClick={() => handleSend(row.id)}>
              <Send className="h-4 w-4" /> Send
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEditCampaign(row.status) && (
                <DropdownMenuItem onClick={() => openEditDialog(row)}>
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {canDeleteCampaign(row.status) && (
                <>
                  {canEditCampaign(row.status) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <Button className="mb-4" onClick={openCreateDialog}>
        <Plus className="h-4 w-4" /> Create Campaign
      </Button>
      <DataTable columns={columns} data={campaigns} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Email Campaign</DialogTitle></DialogHeader>
          {renderCampaignForm(handleCreate, "Create Campaign")}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editCampaign)} onOpenChange={(open) => !open && setEditCampaign(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Email Campaign</DialogTitle></DialogHeader>
          {renderCampaignForm(handleUpdate, "Save Changes")}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete campaign?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.status === "sent"
                ? `"${deleteTarget.subject}" was already sent. Deleting removes it from the dashboard but cannot unsend delivered emails.`
                : `This will permanently delete "${deleteTarget?.subject}".`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
