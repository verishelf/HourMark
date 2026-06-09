"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logActivity } from "@/actions/dealers";
import { formatDateTime } from "@/lib/utils";
import type { DealerActivity, DealerActivityType } from "@/types/database";

const ACTIVITY_TYPES: { value: DealerActivityType; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "instagram_dm", label: "Instagram DM" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone_call", label: "Phone Call" },
  { value: "meeting", label: "Meeting" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "account_created", label: "Account Created" },
  { value: "inventory_imported", label: "Inventory Imported" },
];

export function DealerActivityTimeline({
  dealerId,
  adminId,
  activities,
}: {
  dealerId: string;
  adminId: string;
  activities: DealerActivity[];
}) {
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState<DealerActivityType>("email");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followUp, setFollowUp] = useState("");

  async function handleSubmit() {
    const result = await logActivity(adminId, dealerId, {
      activity_type: activityType,
      notes: notes || undefined,
      outcome: outcome || undefined,
      next_follow_up_at: followUp ? new Date(followUp).toISOString() : undefined,
    });
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Activity logged");
    setOpen(false);
    setNotes("");
    setOutcome("");
    setFollowUp("");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Activity History</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Log Activity
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No activities yet.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((a) => (
              <div key={a.id} className="flex gap-4 border-l-2 border-border pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">
                      {ACTIVITY_TYPES.find((t) => t.value === a.activity_type)?.label ?? a.activity_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
                  </div>
                  {a.notes && <p className="text-sm">{a.notes}</p>}
                  {a.outcome && <p className="text-sm text-muted-foreground mt-1">Outcome: {a.outcome}</p>}
                  {a.next_follow_up_at && (
                    <p className="text-xs text-amber-500 mt-1">
                      Follow-up: {formatDateTime(a.next_follow_up_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={(v) => setActivityType(v as DealerActivityType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Outcome</Label>
              <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} />
            </div>
            <div>
              <Label>Next Follow-Up</Label>
              <Input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
            <Button onClick={handleSubmit}>Save Activity</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
