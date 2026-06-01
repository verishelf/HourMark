import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "@/services/notifications";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { AppNotification } from "@/types";

function notificationIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.includes("offer")) return "pricetag-outline";
  if (type.includes("order") || type.includes("ship")) return "cube-outline";
  if (type.includes("grail") || type.includes("alert")) return "notifications-outline";
  return "mail-outline";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setItems(await getNotifications(user.id));
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;
    return subscribeToNotifications(user.id, (n) => {
      setItems((prev) => [n, ...prev]);
    });
  }, [user, load]);

  const handlePress = async (n: AppNotification) => {
    if (!user) return;
    await markNotificationRead(n.id, user.id);
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    );

    const listingId = n.data?.listing_id as string | undefined;
    if (listingId) router.push(`/listing/${listingId}`);
    else if (n.data?.offer_id) router.push("/messages");
  };

  return (
    <FeatureScreenScaffold
      trailing={
        items.length > 0 ? (
          <Pressable onPress={() => user && markAllNotificationsRead(user.id).then(load)}>
            <Text style={styles.linkText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )
      }
    >
      <ScreenHeader title="Notifications" subtitle="Offers, alerts, and order updates" />

      {items.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="All caught up"
          body="Offer updates, price alerts, and order milestones will appear here."
        />
      ) : (
        items.map((n) => (
          <Pressable
            key={n.id}
            style={[styles.listRow, !n.read_at && styles.listRowUnread]}
            onPress={() => handlePress(n)}
          >
            <View style={styles.iconTile}>
              <Ionicons name={notificationIcon(n.type)} size={22} color={Colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{n.title}</Text>
              {n.body ? <Text style={styles.rowBody}>{n.body}</Text> : null}
              <Text style={styles.rowMeta}>{new Date(n.created_at).toLocaleString()}</Text>
            </View>
            {!n.read_at ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.textPrimary,
                }}
              />
            ) : null}
          </Pressable>
        ))
      )}
    </FeatureScreenScaffold>
  );
}
