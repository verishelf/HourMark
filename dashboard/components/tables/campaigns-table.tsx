"use client";

import { useState } from "react";
import { Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createCampaign, sendCampaign, sendTestEmail } from "@/actions/campaigns";
import { formatDate } from "@/lib/utils";
import type { CampaignAudience, EmailCampaign } from "@/types/database";

export function CampaignsTable({ campaigns, adminId }: { campaigns: EmailCampaign[]; adminId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    template_html: "",
    audience: "all" as CampaignAudience,
    testEmail: "",
  });

  async function handleCreate() {
    await createCampaign(adminId, {
      subject: form.subject,
      template_html: form.template_html,
      audience: form.audience,
    });
    toast.success("Campaign created");
    setCreateOpen(false);
  }

  async function handleSend(campaignId: string) {
    const result = await sendCampaign(adminId, campaignId);
    toast.success(`Campaign sent to ${result.sent ?? 0} recipients`);
  }

  async function handleTest() {
    await sendTestEmail(adminId, form.testEmail, form.subject, form.template_html);
    toast.success("Test email sent");
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
      cell: (row: EmailCampaign) =>
        row.status === "draft" || row.status === "scheduled" ? (
          <Button size="sm" variant="outline" onClick={() => handleSend(row.id)}>
            <Send className="h-4 w-4" /> Send
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Button className="mb-4" onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4" /> Create Campaign
      </Button>
      <DataTable columns={columns} data={campaigns} />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Email Campaign</DialogTitle></DialogHeader>
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
              <Textarea value={form.template_html} onChange={(e) => setForm({ ...form, template_html: e.target.value })} rows={8} />
            </div>
            <div className="flex gap-2">
              <Input placeholder="Test email address" value={form.testEmail} onChange={(e) => setForm({ ...form, testEmail: e.target.value })} />
              <Button variant="outline" onClick={handleTest}>Send Test</Button>
            </div>
            <Button onClick={handleCreate}>Create Campaign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
