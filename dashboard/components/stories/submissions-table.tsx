"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reviewSubmission } from "@/actions/stories";
import { formatDate } from "@/lib/utils";

type Submission = {
  id: string;
  title: string;
  content: string;
  watch_reference: string | null;
  business_lesson: string | null;
  networking_lesson: string | null;
  status: string;
  created_at: string;
  user?: { username: string | null; full_name: string | null } | null;
};

export function SubmissionsTable({ submissions, adminId }: { submissions: Submission[]; adminId: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);

  const review = async (id: string, decision: "approved" | "rejected") => {
    setLoading(true);
    try {
      const result = await reviewSubmission(adminId, id, decision);
      if (result.error) throw new Error(result.error);
      toast.success(decision === "approved" ? "Submission approved & published" : "Submission rejected");
      setPreview(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Review failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DataTable
        data={submissions}
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (row) => (
              <button type="button" className="text-left font-medium hover:underline" onClick={() => setPreview(row)}>
                {row.title}
              </button>
            ),
          },
          {
            key: "author",
            header: "Submitter",
            cell: (row) => row.user?.full_name ?? row.user?.username ?? "—",
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <Badge variant={row.status === "pending" ? "warning" : row.status === "approved" ? "success" : "destructive"}>{row.status}</Badge>,
          },
          {
            key: "date",
            header: "Submitted",
            cell: (row) => formatDate(row.created_at),
          },
        ]}
      />

      <Dialog open={Boolean(preview)} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-4 text-sm">
              <p className="whitespace-pre-wrap text-muted-foreground">{preview.content}</p>
              {preview.watch_reference ? <p><strong>Watch:</strong> {preview.watch_reference}</p> : null}
              {preview.business_lesson ? <p><strong>Business:</strong> {preview.business_lesson}</p> : null}
              {preview.networking_lesson ? <p><strong>Networking:</strong> {preview.networking_lesson}</p> : null}
              {preview.status === "pending" ? (
                <div className="flex gap-2 pt-2">
                  <Button disabled={loading} onClick={() => review(preview.id, "approved")}>Approve & Publish</Button>
                  <Button disabled={loading} variant="destructive" onClick={() => review(preview.id, "rejected")}>Reject</Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
