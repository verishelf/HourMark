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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/dashboard/data-table";
import { suspendUser, verifyUser, changeUserRole, sendUserEmail } from "@/actions/users";
import { ROLE_LABELS, ADMIN_ROLES } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import type { AdminRole, UserProfile } from "@/types/database";

export function UsersTable({ users, adminId }: { users: UserProfile[]; adminId: string }) {
  const [emailDialog, setEmailDialog] = useState<UserProfile | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  async function handleSuspend(userId: string, suspended: boolean) {
    await suspendUser(adminId, userId, suspended);
    toast.success(suspended ? "User suspended" : "User unsuspended");
  }

  async function handleVerify(userId: string) {
    await verifyUser(adminId, userId);
    toast.success("User verified");
  }

  async function handleRoleChange(userId: string, role: string) {
    await changeUserRole(adminId, userId, role === "none" ? null : (role as AdminRole));
    toast.success("Role updated");
  }

  async function handleSendEmail() {
    if (!emailDialog) return;
    const email = emailDialog.email ?? "";
    if (!email) {
      toast.error("This user has no deliverable email (Apple Hide My Email or missing auth email).");
      return;
    }
    const result = await sendUserEmail(adminId, email, emailSubject, emailBody);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Email sent");
    setEmailDialog(null);
  }

  const columns = [
    {
      key: "id",
      header: "User ID",
      cell: (row: UserProfile) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
    },
    {
      key: "name",
      header: "Name",
      cell: (row: UserProfile) => row.full_name ?? row.username ?? "—",
    },
    {
      key: "email",
      header: "Email",
      cell: (row: UserProfile) => row.email ?? row.username ?? "—",
    },
    {
      key: "role",
      header: "Role",
      cell: (row: UserProfile) =>
        row.admin_role ? (
          <Badge>{ROLE_LABELS[row.admin_role]}</Badge>
        ) : row.is_verified_seller ? (
          <Badge variant="success">Seller</Badge>
        ) : (
          <Badge variant="secondary">Buyer</Badge>
        ),
    },
    {
      key: "sales",
      header: "Total Sales",
      cell: (row: UserProfile) => row.total_sales ?? 0,
    },
    {
      key: "purchases",
      header: "Total Purchases",
      cell: (row: UserProfile) => row.total_purchases ?? 0,
    },
    {
      key: "joined",
      header: "Join Date",
      cell: (row: UserProfile) => formatDate(row.created_at),
    },
    {
      key: "actions",
      header: "",
      cell: (row: UserProfile) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleVerify(row.id)}>Verify User</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSuspend(row.id, true)}>Suspend User</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEmailDialog(row)}>Send Email</DropdownMenuItem>
            {ADMIN_ROLES.map((role) => (
              <DropdownMenuItem key={role} onClick={() => handleRoleChange(row.id, role)}>
                Set {ROLE_LABELS[role]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={users} />
      <Dialog open={!!emailDialog} onOpenChange={() => setEmailDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to {emailDialog?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={5} />
            </div>
            <Button onClick={handleSendEmail}>Send Email</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
