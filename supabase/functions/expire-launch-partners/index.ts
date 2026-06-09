import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceKey}` && req.headers.get("x-service-role") !== serviceKey) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }

  const supabase = getServiceClient();

  const { data: expiredCount, error: expireError } = await supabase.rpc("expire_launch_partners");
  if (expireError) {
    return jsonResponse({ message: expireError.message }, 500);
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const notifications: { type: string; title: string; body: string; data: Record<string, unknown> }[] = [];

  const { data: followUpsToday } = await supabase
    .from("dealer_activities")
    .select("id, dealer_id, dealers(company_name)")
    .gte("next_follow_up_at", `${today}T00:00:00Z`)
    .lt("next_follow_up_at", `${today}T23:59:59Z`);

  for (const a of followUpsToday ?? []) {
    const dealer = a.dealers as { company_name?: string } | null;
    notifications.push({
      type: "follow_up_due_today",
      title: "Follow-Up Due Today",
      body: dealer?.company_name ?? "Dealer follow-up due",
      data: { dealer_id: a.dealer_id, activity_id: a.id },
    });
  }

  const { data: overdueFollowUps } = await supabase
    .from("dealer_activities")
    .select("id, dealer_id, dealers(company_name)")
    .lt("next_follow_up_at", `${today}T00:00:00Z`);

  for (const a of overdueFollowUps ?? []) {
    const dealer = a.dealers as { company_name?: string } | null;
    notifications.push({
      type: "follow_up_overdue",
      title: "Overdue Follow-Up",
      body: dealer?.company_name ?? "Dealer follow-up overdue",
      data: { dealer_id: a.dealer_id, activity_id: a.id },
    });
  }

  const { data: meetingsTomorrow } = await supabase
    .from("dealer_activities")
    .select("id, dealer_id, dealers(company_name)")
    .eq("activity_type", "meeting")
    .gte("created_at", `${tomorrowStr}T00:00:00Z`)
    .lt("created_at", `${tomorrowStr}T23:59:59Z`);

  for (const a of meetingsTomorrow ?? []) {
    const dealer = a.dealers as { company_name?: string } | null;
    notifications.push({
      type: "meeting_tomorrow",
      title: "Meeting Tomorrow",
      body: dealer?.company_name ?? "Dealer meeting scheduled",
      data: { dealer_id: a.dealer_id, activity_id: a.id },
    });
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: proposalsWaiting } = await supabase
    .from("dealers")
    .select("id, company_name")
    .eq("pipeline_status", "proposal_sent")
    .lt("updated_at", weekAgo.toISOString());

  for (const d of proposalsWaiting ?? []) {
    notifications.push({
      type: "proposal_waiting",
      title: "Proposal Waiting",
      body: `${d.company_name} — proposal sent over 7 days ago`,
      data: { dealer_id: d.id },
    });
  }

  const { data: lp7 } = await supabase
    .from("dealers")
    .select("id, company_name, launch_partner_expires")
    .eq("is_launch_partner", true)
    .gte("launch_partner_expires", now.toISOString())
    .lte("launch_partner_expires", in7Days.toISOString());

  for (const d of lp7 ?? []) {
    notifications.push({
      type: "launch_partner_expiring_7",
      title: "Launch Partner Expiring in 7 Days",
      body: d.company_name,
      data: { dealer_id: d.id, expires: d.launch_partner_expires },
    });
  }

  const { data: lp30 } = await supabase
    .from("dealers")
    .select("id, company_name, launch_partner_expires")
    .eq("is_launch_partner", true)
    .gt("launch_partner_expires", in7Days.toISOString())
    .lte("launch_partner_expires", in30Days.toISOString());

  for (const d of lp30 ?? []) {
    notifications.push({
      type: "launch_partner_expiring_30",
      title: "Launch Partner Expiring in 30 Days",
      body: d.company_name,
      data: { dealer_id: d.id, expires: d.launch_partner_expires },
    });
  }

  if (notifications.length > 0) {
    await supabase.from("admin_notifications").insert(notifications);
  }

  return jsonResponse({
    expired: expiredCount ?? 0,
    notifications_created: notifications.length,
  });
});
