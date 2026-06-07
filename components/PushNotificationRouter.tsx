import { useRouter } from "expo-router";
import { useNotificationResponse } from "@/hooks/usePushNotifications";

/** Navigates when the user taps a push notification with `data.url`. */
export function PushNotificationRouter() {
  const router = useRouter();

  useNotificationResponse((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    const url = typeof data?.url === "string" ? data.url : null;
    if (!url) return;

    const path = url.startsWith("/") ? url : `/${url}`;
    router.push(path as Parameters<typeof router.push>[0]);
  });

  return null;
}
