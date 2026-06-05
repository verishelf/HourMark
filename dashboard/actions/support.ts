"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { TicketStatus } from "@/types/database";

export async function updateTicketStatus(
  adminId: string,
  ticketId: string,
  status: TicketStatus
) {
  const supabase = createServiceClient();
  await supabase
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  await logAdminAction({
    adminId,
    action: "update_ticket_status",
    resourceType: "support_ticket",
    resourceId: ticketId,
    details: { status },
  });
  revalidatePath("/support");
  return { success: true };
}

export async function assignTicket(adminId: string, ticketId: string, assigneeId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("support_tickets")
    .update({ assigned_to: assigneeId, status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  await logAdminAction({
    adminId,
    action: "assign_ticket",
    resourceType: "support_ticket",
    resourceId: ticketId,
    details: { assigneeId },
  });
  revalidatePath("/support");
  return { success: true };
}

export async function replyToTicket(
  adminId: string,
  ticketId: string,
  reply: string
) {
  const supabase = createServiceClient();
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("body, user_id")
    .eq("id", ticketId)
    .single();

  if (!ticket) return { error: "Ticket not found" };

  const updatedBody = `${ticket.body}\n\n--- Admin Reply ---\n${reply}`;
  await supabase
    .from("support_tickets")
    .update({ body: updatedBody, status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  await supabase.from("notifications").insert({
    user_id: ticket.user_id,
    type: "support_reply",
    title: "Support Ticket Update",
    body: reply.slice(0, 200),
    data: { ticket_id: ticketId },
  });

  await logAdminAction({
    adminId,
    action: "reply_ticket",
    resourceType: "support_ticket",
    resourceId: ticketId,
  });
  revalidatePath("/support");
  return { success: true };
}
