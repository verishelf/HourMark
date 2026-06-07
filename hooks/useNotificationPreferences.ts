import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type NotificationPreferences = {
  pushEnabled: boolean;
  offers: boolean;
  orders: boolean;
  messages: boolean;
  priceAlerts: boolean;
  searchAlerts: boolean;
  stories: boolean;
};

const STORAGE_KEY = "@crownly/notification_preferences";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  offers: true,
  orders: true,
  messages: true,
  priceAlerts: true,
  searchAlerts: true,
  stories: true,
};

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        setPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const updatePreference = useCallback(
    async <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
      setPrefs((current) => {
        const next = { ...current, [key]: value };
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return { prefs, loaded, updatePreference };
}
