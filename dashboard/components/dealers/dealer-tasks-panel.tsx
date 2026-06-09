"use client";

import { useState } from "react";
import { Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, completeTask } from "@/actions/dealers";
import { formatDate } from "@/lib/utils";
import type { DealerTask, DealerTaskPriority, UserProfile } from "@/types/database";

const priorityVariant: Record<DealerTaskPriority, "default" | "warning" | "destructive" | "secondary"> = {
  low: "secondary",
  medium: "default",
  high: "warning",
  urgent: "destructive",
};

function isOverdue(task: DealerTask): boolean {
  if (task.status === "done" || !task.due_at) return false;
  return new Date(task.due_at) < new Date();
}

export function DealerTasksPanel({
  dealerId,
  adminId,
  tasks,
  admins,
}: {
  dealerId: string;
  adminId: string;
  tasks: DealerTask[];
  admins: UserProfile[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<DealerTaskPriority>("medium");

  async function handleCreate() {
    const result = await createTask(adminId, dealerId, {
      title,
      assigned_to: assignedTo || undefined,
      due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
      priority,
    });
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Task created");
    setOpen(false);
    setTitle("");
    setDueAt("");
  }

  async function handleComplete(taskId: string) {
    const result = await completeTask(adminId, taskId, dealerId);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Task completed");
  }

  const openTasks = tasks.filter((t) => t.status !== "done");
  const overdueTasks = openTasks.filter(isOverdue);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Tasks</CardTitle>
          {overdueTasks.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {overdueTasks.length} overdue
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className={`flex items-start justify-between gap-3 rounded-md border p-3 ${
                  isOverdue(t) ? "border-destructive/50 bg-destructive/5" : "border-border"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                    </span>
                    <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>
                    {t.status !== "done" && (
                      <Badge variant="secondary">{t.status.replace("_", " ")}</Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {t.due_at && <span>Due {formatDate(t.due_at)}</span>}
                    {t.assignee?.full_name && <span>→ {t.assignee.full_name}</span>}
                  </div>
                </div>
                {t.status !== "done" && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleComplete(t.id)}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up on proposal" />
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger><SelectValue placeholder="Select admin" /></SelectTrigger>
                <SelectContent>
                  {admins.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name ?? a.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as DealerTaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate}>Create Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
