import { useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { SettingsToggleRow } from "@/components/SettingsToggleRow";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { registerPushToken, removePushToken } from "@/services/notifications";
import { screenContentPadding } from "@/styles/layout";

async function syncPushToken(userId: string, enabled: boolean) {
  if (!Device.isDevice) return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;

  if (!enabled) {
    try {
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      await removePushToken(userId, token.data);
    } catch {
      // No registered token on this device
    }
    return;
  }

  const { granted } = await Notifications.getPermissionsAsync();
  let allowed = granted;
  if (!allowed) {
    const result = await Notifications.requestPermissionsAsync();
    allowed = result.granted;
  }
  if (!allowed) return;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerPushToken(userId, token.data, Platform.OS === "ios" ? "ios" : "android");
}

function createStyles() {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    card: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      overflow: "hidden",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingBottom: 12,
    },
    topBarTitles: {
      flex: 1,
      minWidth: 0,
    },
    topBarTitle: {
      ...Typography.h3,
      color: Colors.textPrimary,
    },
    topBarSubtitle: {
      ...Typography.caption,
      color: Colors.textMuted,
      marginTop: 2,
    },
    sectionLabel: {
      ...Typography.label,
      color: Colors.textMuted,
      marginBottom: SPACING.sm,
      letterSpacing: 0.6,
    },
  });
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const { prefs, loaded, updatePreference } = useNotificationPreferences();

  const setPushEnabled = useCallback(
    async (enabled: boolean) => {
      await updatePreference("pushEnabled", enabled);
      if (user) await syncPushToken(user.id, enabled);
    },
    [updatePreference, user]
  );

  const pushDisabled = !loaded;

  return (
    <View style={styles.screen}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: SPACING.screen }}>
        <View style={styles.topBar}>
          <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
          <View style={styles.topBarTitles}>
            <Text style={styles.topBarTitle}>Notifications</Text>
            <Text style={styles.topBarSubtitle}>Choose what you want to hear about</Text>
          </View>
        </View>
      </View>

      <View style={screenContentPadding(insets.bottom)}>
        <Text style={styles.sectionLabel}>PUSH</Text>
        <View style={styles.card}>
          <SettingsToggleRow
            label="Push notifications"
            icon="notifications-outline"
            subtitle="Allow alerts on this device."
            value={prefs.pushEnabled}
            onValueChange={(value) => void setPushEnabled(value)}
            disabled={pushDisabled}
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: SPACING.section }]}>ACTIVITY</Text>
        <View style={styles.card}>
          <SettingsToggleRow
            label="Offers"
            icon="pricetag-outline"
            subtitle="When someone makes or responds to an offer."
            value={prefs.offers}
            onValueChange={(value) => void updatePreference("offers", value)}
            disabled={!prefs.pushEnabled || pushDisabled}
          />
          <SettingsToggleRow
            label="Messages"
            icon="chatbubble-outline"
            subtitle="New messages from buyers and sellers."
            value={prefs.messages}
            onValueChange={(value) => void updatePreference("messages", value)}
            disabled={!prefs.pushEnabled || pushDisabled}
          />
          <SettingsToggleRow
            label="Orders"
            icon="cube-outline"
            subtitle="Shipping, delivery, and order milestones."
            value={prefs.orders}
            onValueChange={(value) => void updatePreference("orders", value)}
            disabled={!prefs.pushEnabled || pushDisabled}
          />
          <SettingsToggleRow
            label="Price alerts"
            icon="trending-down-outline"
            subtitle="When a saved watch drops in price."
            value={prefs.priceAlerts}
            onValueChange={(value) => void updatePreference("priceAlerts", value)}
            disabled={!prefs.pushEnabled || pushDisabled}
          />
          <SettingsToggleRow
            label="Saved searches"
            icon="search-outline"
            subtitle="When new listings match your alerts."
            value={prefs.searchAlerts}
            onValueChange={(value) => void updatePreference("searchAlerts", value)}
            disabled={!prefs.pushEnabled || pushDisabled}
          />
          <SettingsToggleRow
            label="Crownly Stories"
            icon="book-outline"
            subtitle="Editorial drops and featured stories."
            value={prefs.stories}
            onValueChange={(value) => void updatePreference("stories", value)}
            disabled={!prefs.pushEnabled || pushDisabled}
            isLast
          />
        </View>
      </View>
    </View>
  );
}
