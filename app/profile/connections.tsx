import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useAuth } from "@/hooks/useAuth";
import { getFollowers, getFollowing } from "@/services/follows";
import { getOrCreateConversationWithSeller } from "@/services/messaging";
import { tabContentPadding } from "@/styles/layout";
import type { UserProfile } from "@/types";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200";

const AVATAR_SIZE = 56;
const VERIFIED_BLUE = "#3897F0";

type ConnectionType = "followers" | "following";

function ConnectionRow({
  profile,
  showMessage,
  onPressProfile,
  onMessage,
  messaging,
}: {
  profile: UserProfile;
  showMessage: boolean;
  onPressProfile: () => void;
  onMessage: () => void;
  messaging: boolean;
}) {
  const handle = profile.username?.trim() || "user";
  const displayName = profile.full_name?.trim();

  return (
    <Pressable
      onPress={onPressProfile}
      style={({ pressed }) => [styles.rowOuter, pressed && styles.rowPressed]}
    >
      <View style={styles.row}>
        <View style={styles.avatarSlot}>
          <Image
            source={{ uri: profile.avatar_url ?? DEFAULT_AVATAR }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        <View style={styles.meta}>
          <View style={styles.usernameRow}>
            <Text style={styles.username} numberOfLines={1}>
              {handle}
            </Text>
            {profile.verified ? (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={VERIFIED_BLUE}
                style={styles.verifiedIcon}
              />
            ) : null}
          </View>
          {displayName ? (
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
          ) : null}
        </View>

        {showMessage ? (
          <Pressable
            onPress={onMessage}
            disabled={messaging}
            style={({ pressed }) => [
              styles.messageButton,
              pressed && styles.messageButtonPressed,
            ]}
          >
            {messaging ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={styles.messageLabel}>Message</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.messageSpacer} />
        )}
      </View>
    </Pressable>
  );
}

export default function ProfileConnectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { userId, type } = useLocalSearchParams<{ userId: string; type: ConnectionType }>();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const connectionType: ConnectionType = type === "following" ? "following" : "followers";
  const title = connectionType === "followers" ? "Followers" : "Following";
  const listWidth = screenWidth - SPACING.screen * 2;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data =
          connectionType === "followers"
            ? await getFollowers(userId)
            : await getFollowing(userId);
        if (!cancelled) setProfiles(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, connectionType]);

  const openProfile = (profile: UserProfile) => {
    if (profile.id === user?.id) {
      router.push("/(tabs)/profile");
      return;
    }
    router.push(`/seller/${profile.id}`);
  };

  const handleMessage = useCallback(
    async (profile: UserProfile) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setMessagingId(profile.id);
      try {
        const conversation = await getOrCreateConversationWithSeller({
          buyerId: user.id,
          sellerId: profile.id,
          listingId: null,
        });
        router.push(`/chat/${conversation.id}`);
      } catch (e) {
        Alert.alert("Message", e instanceof Error ? e.message : "Could not open chat.");
      } finally {
        setMessagingId(null);
      }
    },
    [router, user]
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={title}
        rightAction={
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backLabel}>Done</Text>
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.textPrimary} />
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          {...HIDE_SCROLL_INDICATORS}
          style={styles.list}
          contentContainerStyle={{
            ...tabContentPadding(insets.bottom),
            paddingHorizontal: SPACING.screen,
          }}
          ListEmptyComponent={
            <EmptyState
              compact
              icon="people-outline"
              title={`No ${title.toLowerCase()} yet`}
              body={
                connectionType === "followers"
                  ? "When people follow this account, they'll show up here."
                  : "Accounts this user follows will show up here."
              }
            />
          }
          renderItem={({ item }) => (
            <View style={{ width: listWidth }}>
              <ConnectionRow
                profile={item}
                showMessage={Boolean(user && item.id !== user.id)}
                onPressProfile={() => openProfile(item)}
                onMessage={() => handleMessage(item)}
                messaging={messagingId === item.id}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  rowOuter: {
    width: "100%",
    paddingVertical: 8,
  },
  rowPressed: {
    opacity: 0.75,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  avatarSlot: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    flexShrink: 0,
    marginRight: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.cardElevated,
  },
  meta: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    height: AVATAR_SIZE,
    justifyContent: "center",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  username: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
    flexShrink: 0,
  },
  name: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
    marginTop: 2,
  },
  messageButton: {
    flexShrink: 0,
    marginLeft: 8,
    minWidth: 88,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  messageSpacer: {
    width: 0,
    flexShrink: 0,
  },
  messageButtonPressed: {
    opacity: 0.85,
  },
  messageLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
