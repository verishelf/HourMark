"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { DataTable } from "@/components/dashboard/data-table";
import {
  CampaignFormFields,
  type CampaignFormState,
} from "@/components/campaigns/campaign-form-fields";
import { EmailTemplatesPanel } from "@/components/campaigns/email-templates-panel";
import {
  createCampaign,
  deleteCampaign,
  sendCampaign,
  sendTestEmail,
  updateCampaign,
} from "@/actions/campaigns";
import { formatDate } from "@/lib/utils";
import type { CampaignAudience, EmailCampaign, EmailCampaignTemplate } from "@/types/database";

const EMPTY_FORM: CampaignFormState = {
  subject: "",
  template_html: "",
  audience: "all",
  testEmail: "",
  selectedTemplateId: "blank",
};

function canEditCampaign(status: EmailCampaign["status"]) {
  return status === "draft" || status === "scheduled" || status === "cancelled";
}

function canDeleteCampaign(status: EmailCampaign["status"]) {
  return status !== "sending";
}

export function CampaignsTable({
  campaigns,
  templates,
  adminId,
}: {
  campaigns: EmailCampaign[];
  templates: EmailCampaignTemplate[];
  adminId: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<EmailCampaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailCampaign | null>(null);
  const [form, setForm] = useState<CampaignFormState>(EMPTY_FORM);

  function refreshTemplates() {
    router.refresh();
  }

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function openCreateDialog() {
    resetForm();
    const defaultTemplate = templates[0];
    if (defaultTemplate) {
      setForm({
        ...EMPTY_FORM,
        selectedTemplateId: defaultTemplate.id,
        subject: defaultTemplate.default_subject,
        template_html: defaultTemplate.html,
      });
    }
    setCreateOpen(true);
  }

  function openEditDialog(campaign: EmailCampaign) {
    setForm({
      subject: campaign.subject,
      template_html: campaign.template_html,
      audience: campaign.audience,
      testEmail: "",
      selectedTemplateId: campaign.template_id ?? "blank",
    });
    setEditCampaign(campaign);
  }

  async function handleCreate() {
    const result = await createCampaign(adminId, {
      subject: form.subject,
      template_html: form.template_html,
      audience: form.audience,
      template_id: form.selectedTemplateId === "blank" ? null : form.selectedTemplateId,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Campaign created");
    setCreateOpen(false);
    resetForm();
    router.refresh();
  }

  async function handleUpdate() {
    if (!editCampaign) return;
    const result = await updateCampaign(adminId, editCampaign.id, {
      subject: form.subject,
      template_html: form.template_html,
      audience: form.audience,
      template_id: form.selectedTemplateId === "blank" ? null : form.selectedTemplateId,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Campaign updated");
    setEditCampaign(null);
    resetForm();
    router.refresh();
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
    router.refresh();
  }

  async function handleSend(campaignId: string) {
    const result = await sendCampaign(adminId, campaignId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Campaign sent to ${result.sent ?? 0} recipient(s)`);
    router.refresh();
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

  const columns = [
    { key: "subject", header: "Subject", cell: (row: EmailCampaign) => row.subject },
    {
      key: "audience",
      header: "Audience",
      cell: (row: EmailCampaign) => <Badge variant="secondary">{row.audience}</Badge>,
    },
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
      <EmailTemplatesPanel templates={templates} adminId={adminId} />

      <Button className="mb-4 w-full sm:w-auto" onClick={openCreateDialog}>
        <Plus className="h-4 w-4" /> Create Campaign
      </Button>
      <DataTable columns={columns} data={campaigns} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
          </DialogHeader>
          <CampaignFormFields
            adminId={adminId}
            form={form}
            setForm={setForm}
            templates={templates}
            onTest={handleTest}
            onTemplatesChanged={refreshTemplates}
          />
          <Button onClick={handleCreate}>Create Campaign</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editCampaign)} onOpenChange={(open) => !open && setEditCampaign(null)}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Email Campaign</DialogTitle>
          </DialogHeader>
          <CampaignFormFields
            adminId={adminId}
            form={form}
            setForm={setForm}
            templates={templates}
            onTest={handleTest}
            onTemplatesChanged={refreshTemplates}
          />
          <Button onClick={handleUpdate}>Save Changes</Button>
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
