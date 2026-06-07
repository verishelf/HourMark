import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { SwipeToDeleteRow } from "@/components/SwipeToDeleteRow";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  deleteAllNotifications,
  deleteNotification,
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

    const offerId = n.data?.offer_id as string | undefined;
    const listingId = n.data?.listing_id as string | undefined;
    const url = n.data?.url as string | undefined;

    if (url) {
      router.push((url.startsWith("/") ? url : `/${url}`) as Parameters<typeof router.push>[0]);
      return;
    }
    if (offerId && n.type.includes("offer")) {
      router.push(`/offer/${offerId}`);
      return;
    }
    if (listingId) router.push(`/listing/${listingId}`);
  };

  const confirmDeleteNotification = (n: AppNotification) => {
    if (!user) return;
    Alert.alert("Delete notification", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setItems((prev) => prev.filter((x) => x.id !== n.id));
          try {
            await deleteNotification(n.id, user.id);
          } catch (e) {
            void load();
            Alert.alert("Error", e instanceof Error ? e.message : "Could not delete");
          }
        },
      },
    ]);
  };

  const confirmClearAll = () => {
    if (!user) return;
    Alert.alert("Clear all notifications", "This permanently removes all notifications.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear all",
        style: "destructive",
        onPress: async () => {
          setItems([]);
          try {
            await deleteAllNotifications(user.id);
          } catch (e) {
            void load();
            Alert.alert("Error", e instanceof Error ? e.message : "Could not clear notifications");
          }
        },
      },
    ]);
  };

  return (
    <FeatureScreenScaffold
      title="Notifications"
      subtitle="Offers, alerts, and order updates"
      trailing={
        items.length > 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Pressable onPress={() => user && markAllNotificationsRead(user.id).then(load)}>
              <Text style={styles.linkText}>Mark read</Text>
            </Pressable>
            <Pressable onPress={confirmClearAll}>
              <Text style={[styles.linkText, { color: Colors.error }]}>Clear all</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="All caught up"
          body="Offer updates, price alerts, and order milestones will appear here."
        />
      ) : (
        items.map((n) => (
          <SwipeToDeleteRow
            key={n.id}
            onDelete={() => confirmDeleteNotification(n)}
          >
            <Pressable
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
          </SwipeToDeleteRow>
        ))
      )}
    </FeatureScreenScaffold>
  );
}
