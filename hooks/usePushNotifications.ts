import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { registerPushToken, removePushToken } from "@/services/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { granted: existingGranted } = await Notifications.getPermissionsAsync();
  let finalGranted = existingGranted;
  if (!existingGranted) {
    const { granted } = await Notifications.requestPermissionsAsync();
    finalGranted = granted;
  }
  if (!finalGranted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function usePushNotifications(userId: string | undefined) {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    (async () => {
      try {
        const token = await getExpoPushToken();
        if (!mounted || !token) return;
        tokenRef.current = token;
        await registerPushToken(userId, token, Platform.OS === "ios" ? "ios" : "android");
      } catch {
        // Push unavailable in simulator or without permissions
      }
    })();

    return () => {
      mounted = false;
      if (tokenRef.current && userId) {
    void removePushToken(userId, tokenRef.current);
      }
    };
  }, [userId]);
}

export function useNotificationListener(
  onNotification: (notification: Notifications.Notification) => void
) {
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(onNotification);
    return () => sub.remove();
  }, [onNotification]);
}

export function useNotificationResponse(
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(onResponse);
    return () => sub.remove();
  }, [onResponse]);
}
