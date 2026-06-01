import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AppNotification } from "@/types";

const MOCK_NOTIFICATIONS: AppNotification[] = [];

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}): Promise<AppNotification> {
  const notification: AppNotification = {
    id: `notif-${Date.now()}`,
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    data: params.data ?? {},
    read_at: null,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    MOCK_NOTIFICATIONS.unshift(notification);
    return notification;
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      data: params.data ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AppNotification;
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  if (!isSupabaseConfigured) {
    return MOCK_NOTIFICATIONS.filter((n) => n.user_id === userId);
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured) {
    return MOCK_NOTIFICATIONS.filter((n) => n.user_id === userId && !n.read_at).length;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const n = MOCK_NOTIFICATIONS.find((x) => x.id === notificationId);
    if (n) n.read_at = new Date().toISOString();
    return;
  }

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    for (const n of MOCK_NOTIFICATIONS) {
      if (n.user_id === userId) n.read_at = new Date().toISOString();
    }
    return;
  }

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function registerPushToken(
  userId: string,
  token: string,
  platform: "ios" | "android" | "web" = "ios"
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from("push_tokens").upsert(
    { user_id: userId, token, platform },
    { onConflict: "user_id,token" }
  );
  if (error) throw error;
}

export async function removePushToken(userId: string, token: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  await supabase.from("push_tokens").delete().eq("user_id", userId).eq("token", token);
}

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: AppNotification) => void
) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNotification(payload.new as AppNotification)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
