"use client";

import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { DataTable } from "@/components/dashboard/data-table";
import { updateLeadStatus, addLeadNotes, createLead } from "@/actions/leads";
import { formatCurrency } from "@/lib/utils";
import type { LeadStatus, SellerLead } from "@/types/database";

const LEAD_STATUSES: LeadStatus[] = [
  "new", "contacted", "interested", "negotiating", "seller_onboarded", "closed",
];

const statusVariant: Record<LeadStatus, "default" | "success" | "warning" | "secondary"> = {
  new: "warning",
  contacted: "secondary",
  interested: "default",
  negotiating: "default",
  seller_onboarded: "success",
  closed: "secondary",
};

export function LeadsTable({ leads, adminId }: { leads: SellerLead[]; adminId: string }) {
  const [notesDialog, setNotesDialog] = useState<SellerLead | null>(null);
  const [notes, setNotes] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", watch_brand: "", model: "", estimated_value: "" });

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    await updateLeadStatus(adminId, leadId, status);
    toast.success("Status updated");
  }

  async function handleSaveNotes() {
    if (!notesDialog) return;
    await addLeadNotes(adminId, notesDialog.id, notes);
    toast.success("Notes saved");
    setNotesDialog(null);
  }

  async function handleCreate() {
    await createLead({
      ...newLead,
      estimated_value: newLead.estimated_value ? parseInt(newLead.estimated_value) * 100 : undefined,
    });
    toast.success("Lead created");
    setCreateOpen(false);
  }

  const columns = [
    { key: "id", header: "Lead ID", cell: (row: SellerLead) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span> },
    { key: "name", header: "Name", cell: (row: SellerLead) => row.name },
    { key: "email", header: "Email", cell: (row: SellerLead) => row.email },
    { key: "phone", header: "Phone", cell: (row: SellerLead) => row.phone ?? "—" },
    { key: "brand", header: "Watch Brand", cell: (row: SellerLead) => row.watch_brand },
    { key: "model", header: "Model", cell: (row: SellerLead) => row.model },
    {
      key: "value",
      header: "Est. Value",
      cell: (row: SellerLead) => row.estimated_value ? formatCurrency(row.estimated_value) : "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (row: SellerLead) => (
        <Badge variant={statusVariant[row.status]}>{row.status.replace("_", " ")}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row: SellerLead) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setNotesDialog(row); setNotes(row.notes ?? ""); }}>
              Add Notes
            </DropdownMenuItem>
            {LEAD_STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => handleStatusChange(row.id, s)}>
                Set {s.replace("_", " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add Lead</Button>
      </div>
      <DataTable columns={columns} data={leads} />
      <Dialog open={!!notesDialog} onOpenChange={() => setNotesDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lead Notes</DialogTitle></DialogHeader>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} />
          <Button onClick={handleSaveNotes}>Save Notes</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Seller Lead</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            {(["name", "email", "phone", "watch_brand", "model", "estimated_value"] as const).map((field) => (
              <div key={field}>
                <Label className="capitalize">{field.replace("_", " ")}</Label>
                <Input
                  value={newLead[field]}
                  onChange={(e) => setNewLead({ ...newLead, [field]: e.target.value })}
                />
              </div>
            ))}
            <Button onClick={handleCreate}>Create Lead</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
