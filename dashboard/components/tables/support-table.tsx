"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/dashboard/data-table";
import { updateTicketStatus, replyToTicket } from "@/actions/support";
import { formatDate } from "@/lib/utils";
import type { SupportTicket, TicketStatus } from "@/types/database";

const priorityVariant = { low: "secondary", medium: "default", high: "warning", urgent: "destructive" } as const;

export function SupportTable({ tickets, adminId }: { tickets: SupportTicket[]; adminId: string }) {
  const [replyDialog, setReplyDialog] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");

  async function handleStatus(ticketId: string, status: TicketStatus) {
    await updateTicketStatus(adminId, ticketId, status);
    toast.success("Ticket updated");
  }

  async function handleReply() {
    if (!replyDialog) return;
    await replyToTicket(adminId, replyDialog.id, reply);
    toast.success("Reply sent");
    setReplyDialog(null);
  }

  const columns = [
    { key: "id", header: "Ticket ID", cell: (row: SupportTicket) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span> },
    { key: "user", header: "User", cell: (row: SupportTicket) => row.user?.full_name ?? row.user?.username ?? "—" },
    { key: "subject", header: "Subject", cell: (row: SupportTicket) => row.subject },
    {
      key: "priority",
      header: "Priority",
      cell: (row: SupportTicket) => <Badge variant={priorityVariant[row.priority]}>{row.priority}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: SupportTicket) => <Badge>{row.status.replace("_", " ")}</Badge>,
    },
    { key: "date", header: "Created", cell: (row: SupportTicket) => formatDate(row.created_at) },
    {
      key: "actions",
      header: "",
      cell: (row: SupportTicket) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setReplyDialog(row); setReply(""); }}>Reply</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatus(row.id, "in_progress")}>Assign Staff</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatus(row.id, "closed")}>Close Ticket</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={tickets} />
      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reply to Ticket</DialogTitle></DialogHeader>
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} placeholder="Your reply..." />
          <Button onClick={handleReply}>Send Reply</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
