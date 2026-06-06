"use client";

import { useState } from "react";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmailHtmlPreview } from "@/components/campaigns/email-html-preview";
import { deleteEmailTemplate, updateEmailTemplate } from "@/actions/email-templates";
import { formatDate } from "@/lib/utils";
import type { EmailCampaignTemplate } from "@/types/database";

export function EmailTemplatesPanel({
  templates,
  adminId,
}: {
  templates: EmailCampaignTemplate[];
  adminId: string;
}) {
  const router = useRouter();
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<EmailCampaignTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailCampaignTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    default_subject: "",
    html: "",
  });

  function openPreview(template: EmailCampaignTemplate) {
    setPreviewTitle(template.name);
    setPreviewHtml(template.html);
    setPreviewOpen(true);
  }

  function openEdit(template: EmailCampaignTemplate) {
    setEditTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description ?? "",
      default_subject: template.default_subject,
      html: template.html,
    });
  }

  async function handleUpdateTemplate() {
    if (!editTemplate) return;
    const result = await updateEmailTemplate(adminId, editTemplate.id, editForm);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Template updated");
    setEditTemplate(null);
    router.refresh();
  }

  async function handleDeleteTemplate() {
    if (!deleteTarget) return;
    const result = await deleteEmailTemplate(adminId, deleteTarget.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Template deleted");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Saved Templates</CardTitle>
          <CardDescription>
            Reuse HTML layouts when creating campaigns. Save custom templates from the campaign form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates yet. Create a campaign and use &quot;Save as Template&quot;, or run the database migration to seed defaults.
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{template.name}</p>
                      <Badge variant="secondary">HTML</Badge>
                    </div>
                    {template.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Subject: {template.default_subject || "—"} · Updated {formatDate(template.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPreview(template)}>
                      <Eye className="h-4 w-4" /> Preview
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(template)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(template)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EmailHtmlPreview
        html={previewHtml}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewTitle}
      />

      <Dialog open={Boolean(editTemplate)} onOpenChange={(open) => !open && setEditTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Default subject</Label>
              <Input
                value={editForm.default_subject}
                onChange={(e) => setEditForm({ ...editForm, default_subject: e.target.value })}
              />
            </div>
            <div>
              <Label>HTML</Label>
              <Textarea
                value={editForm.html}
                onChange={(e) => setEditForm({ ...editForm, html: e.target.value })}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreviewTitle(editForm.name);
                  setPreviewHtml(editForm.html);
                  setPreviewOpen(true);
                }}
              >
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button onClick={handleUpdateTemplate}>Save Template</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{deleteTarget?.name}&quot;. Existing campaigns keep their HTML.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
