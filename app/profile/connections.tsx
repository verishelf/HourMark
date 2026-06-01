import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { FollowButton } from "@/components/FollowButton";
import { UserAvatar } from "@/components/UserAvatar";
import { SearchBar } from "@/components/SearchBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useAuth } from "@/hooks/useAuth";
import { followUser, getFollowers, getFollowing, unfollowUser } from "@/services/follows";
import { getOrCreateConversationWithSeller } from "@/services/messaging";
import { searchUsers } from "@/services/profile";
import { emptyListContentStyle, tabContentPadding } from "@/styles/layout";
import type { UserProfile } from "@/types";

const AVATAR_SIZE = 44;
const AVATAR_TEXT_GAP = 20;
const ROW_ACTION_HEIGHT = 40;
const ROW_ACTION_MIN_WIDTH = 96;
const VERIFIED_BLUE = "#3897F0";
const SEARCH_DEBOUNCE_MS = 300;

type ConnectionType = "followers" | "following";

function matchesQuery(profile: UserProfile, needle: string): boolean {
  const username = profile.username?.toLowerCase() ?? "";
  const fullName = profile.full_name?.toLowerCase() ?? "";
  return username.includes(needle) || fullName.includes(needle);
}

function ConnectionRow({
  profile,
  showMessage,
  showFollow,
  following,
  followLoading,
  onPressProfile,
  onMessage,
  onToggleFollow,
  messaging,
}: {
  profile: UserProfile;
  showMessage: boolean;
  showFollow: boolean;
  following: boolean;
  followLoading: boolean;
  onPressProfile: () => void;
  onMessage: () => void;
  onToggleFollow: () => void;
  messaging: boolean;
}) {
  const handle = profile.username?.trim() || "user";
  const displayName = profile.full_name?.trim();

  return (
    <View style={styles.rowOuter}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Pressable
            onPress={onPressProfile}
            style={({ pressed }) => [styles.avatarTap, pressed && styles.rowPressed]}
          >
            <UserAvatar uri={profile.avatar_url} size={AVATAR_SIZE} />
          </Pressable>
        </View>

        <View style={styles.avatarTextSpacer} />

        <Pressable
          onPress={onPressProfile}
          style={({ pressed }) => [styles.info, pressed && styles.rowPressed]}
        >
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
        </Pressable>

        {(showFollow || showMessage) && (
          <View style={styles.action}>
            {showFollow ? (
              <FollowButton
                following={following}
                loading={followLoading}
                onPress={onToggleFollow}
                compact
                style={styles.rowActionShell}
              />
            ) : (
              <Pressable
                onPress={onMessage}
                disabled={messaging}
                style={({ pressed }) => [
                  styles.rowAction,
                  pressed && styles.rowActionPressed,
                ]}
              >
                {messaging ? (
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                ) : (
                  <Text style={styles.messageLabel}>Message</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
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
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

  const connectionType: ConnectionType = type === "following" ? "following" : "followers";
  const title = connectionType === "followers" ? "Followers" : "Following";
  const listWidth = screenWidth - SPACING.screen * 2;
  const isOwnList = Boolean(user?.id && userId === user.id);
  const normalizedQuery = query.trim().toLowerCase();
  const isDiscoverSearch = isOwnList && debouncedQuery.length >= 2;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

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

  const refreshFollowingIds = useCallback(async () => {
    if (!user) return;
    const list = await getFollowing(user.id);
    setFollowingIds(new Set(list.map((p) => p.id)));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void refreshFollowingIds();
    }, [refreshFollowingIds])
  );

  useEffect(() => {
    if (!isDiscoverSearch) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    searchUsers(debouncedQuery, { excludeUserId: user?.id })
      .then((results) => {
        if (!cancelled) setSearchResults(results);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isDiscoverSearch, user?.id]);

  const filteredConnections = useMemo(() => {
    if (!normalizedQuery) return profiles;
    return profiles.filter((p) => matchesQuery(p, normalizedQuery));
  }, [profiles, normalizedQuery]);

  const listData = useMemo(() => {
    if (isDiscoverSearch) return searchResults;
    return filteredConnections;
  }, [isDiscoverSearch, searchResults, filteredConnections]);

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
        router.push("/auth/welcome");
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

  const handleToggleFollow = useCallback(
    async (profile: UserProfile) => {
      if (!user) {
        router.push("/auth/welcome");
        return;
      }
      if (profile.id === user.id) return;

      const isCurrentlyFollowing = followingIds.has(profile.id);
      setFollowLoadingId(profile.id);

      if (isCurrentlyFollowing) {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(profile.id);
          return next;
        });
      } else {
        setFollowingIds((prev) => new Set(prev).add(profile.id));
      }

      try {
        if (isCurrentlyFollowing) {
          await unfollowUser(user.id, profile.id);
          if (connectionType === "following" && isOwnList && !isDiscoverSearch) {
            setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
          }
        } else {
          await followUser(user.id, profile.id);
          if (connectionType === "following" && isOwnList && !isDiscoverSearch) {
            setProfiles((prev) =>
              prev.some((p) => p.id === profile.id) ? prev : [...prev, profile]
            );
          }
        }
        await refreshFollowingIds();
      } catch (e) {
        await refreshFollowingIds();
        Alert.alert("Follow", e instanceof Error ? e.message : "Could not update follow.");
      } finally {
        setFollowLoadingId(null);
      }
    },
    [
      user,
      followingIds,
      connectionType,
      isOwnList,
      isDiscoverSearch,
      router,
      refreshFollowingIds,
    ]
  );

  const emptyTitle = isDiscoverSearch
    ? "No users found"
    : `No ${title.toLowerCase()} yet`;

  const emptyBody = isDiscoverSearch
    ? `No accounts match "${debouncedQuery}". Try another username or name.`
    : connectionType === "followers"
      ? "When people follow this account, they'll show up here."
      : "Accounts this user follows will show up here.";

  const showListLoader = loading || (isDiscoverSearch && searching);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={title}
        rightAction={
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backLabel}>Done</Text>
          </Pressable>
        }
        bottomContent={
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search by username or name"
            compact
          />
        }
      />

      {showListLoader && listData.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.textPrimary} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          {...HIDE_SCROLL_INDICATORS}
          style={styles.list}
          contentContainerStyle={
            listData.length === 0 && !showListLoader
              ? {
                  ...emptyListContentStyle(insets.bottom),
                  paddingHorizontal: SPACING.screen,
                }
              : {
                  ...tabContentPadding(insets.bottom),
                  paddingHorizontal: SPACING.screen,
                }
          }
          ListHeaderComponent={
            isDiscoverSearch ? (
              <Text style={styles.searchHint}>
                People on Crownly matching "{debouncedQuery}"
              </Text>
            ) : normalizedQuery ? (
              <Text style={styles.searchHint}>
                {filteredConnections.length} in your {title.toLowerCase()}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              fill
              compact
              icon="people-outline"
              title={emptyTitle}
              body={emptyBody}
            />
          }
          renderItem={({ item }) => {
            const isSelf = item.id === user?.id;
            const showFollow =
              isDiscoverSearch && Boolean(user) && !isSelf;
            const showMessage =
              Boolean(user && !isSelf && !showFollow);

            return (
              <View style={{ width: listWidth }}>
                <ConnectionRow
                  profile={item}
                  showMessage={showMessage}
                  showFollow={showFollow}
                  following={followingIds.has(item.id)}
                  followLoading={followLoadingId === item.id}
                  onPressProfile={() => openProfile(item)}
                  onMessage={() => handleMessage(item)}
                  onToggleFollow={() => handleToggleFollow(item)}
                  messaging={messagingId === item.id}
                />
              </View>
            );
          }}
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
  searchHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  backLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  rowOuter: {
    width: "100%",
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.75,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatarTextSpacer: {
    width: AVATAR_TEXT_GAP,
    flexShrink: 0,
  },
  avatarTap: {
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
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
    fontWeight: "700",
    lineHeight: 18,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
    flexShrink: 0,
  },
  name: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
    marginTop: 1,
  },
  action: {
    flexShrink: 0,
    alignSelf: "center",
    marginLeft: "auto",
  },
  rowActionShell: {
    minWidth: ROW_ACTION_MIN_WIDTH,
    height: ROW_ACTION_HEIGHT,
    borderRadius: RADIUS.md,
  },
  rowAction: {
    minWidth: ROW_ACTION_MIN_WIDTH,
    height: ROW_ACTION_HEIGHT,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowActionPressed: {
    opacity: 0.85,
  },
  messageLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
