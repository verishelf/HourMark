"use client";

import { useState } from "react";
import { Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailHtmlPreview } from "@/components/campaigns/email-html-preview";
import { createEmailTemplate } from "@/actions/email-templates";
import type { CampaignAudience, EmailCampaignTemplate } from "@/types/database";

export type CampaignFormState = {
  subject: string;
  template_html: string;
  audience: CampaignAudience;
  testEmail: string;
  selectedTemplateId: string;
};

type CampaignFormFieldsProps = {
  adminId: string;
  form: CampaignFormState;
  setForm: (form: CampaignFormState) => void;
  templates: EmailCampaignTemplate[];
  onTest: () => void;
  onTemplatesChanged?: () => void;
};

export function CampaignFormFields({
  adminId,
  form,
  setForm,
  templates,
  onTest,
  onTemplatesChanged,
}: CampaignFormFieldsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  function applyTemplate(templateId: string) {
    if (templateId === "blank") {
      setForm({ ...form, selectedTemplateId: "blank" });
      return;
    }

    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    setForm({
      ...form,
      selectedTemplateId: template.id,
      subject: template.default_subject || form.subject,
      template_html: template.html,
    });
  }

  async function handleSaveTemplate() {
    if (!saveName.trim()) {
      toast.error("Template name is required.");
      return;
    }
    if (!form.template_html.trim()) {
      toast.error("Add HTML before saving a template.");
      return;
    }

    const result = await createEmailTemplate(adminId, {
      name: saveName,
      description: saveDescription,
      default_subject: form.subject,
      html: form.template_html,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Template saved");
    setSaveOpen(false);
    setSaveName("");
    setSaveDescription("");
    onTemplatesChanged?.();
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label>Saved Template</Label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Select value={form.selectedTemplateId} onValueChange={applyTemplate}>
              <SelectTrigger className="w-full sm:min-w-[220px] sm:flex-1">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank / custom HTML</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSaveOpen(true)}>
              <Save className="h-4 w-4" /> Save as Template
            </Button>
          </div>
        </div>

        <div>
          <Label>Subject</Label>
          <Input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>

        <div>
          <Label>Audience</Label>
          <Select
            value={form.audience}
            onValueChange={(v) => setForm({ ...form, audience: v as CampaignAudience })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="sellers">Sellers</SelectItem>
              <SelectItem value="buyers">Buyers</SelectItem>
              <SelectItem value="dealers">Dealers</SelectItem>
              <SelectItem value="new_leads">New Leads</SelectItem>
              <SelectItem value="web_signups">Website Signups</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Email Template (HTML)</Label>
          <Textarea
            value={form.template_html}
            onChange={(e) =>
              setForm({ ...form, template_html: e.target.value, selectedTemplateId: "blank" })
            }
            rows={12}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Test email address"
            value={form.testEmail}
            onChange={(e) => setForm({ ...form, testEmail: e.target.value })}
          />
          <Button type="button" variant="outline" className="shrink-0" onClick={onTest}>
            Send Test
          </Button>
        </div>
      </div>

      <EmailHtmlPreview
        html={form.template_html}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Campaign Preview"
      />

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template name</Label>
              <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
