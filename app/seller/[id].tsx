import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { ProfileCard } from "@/components/ProfileCard";
import { PostGrid } from "@/components/PostGrid";
import { ProfileTabs, profileTabStyles } from "@/components/ProfileTabs";
import { WatchCard } from "@/components/WatchCard";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { GRID_GAP, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { getSellerActiveListings } from "@/services/listings";
import { getUserPosts } from "@/services/posts";
import {
  followUser,
  getFollowCounts,
  isFollowing,
  unfollowUser,
} from "@/services/follows";
import { getOrCreateConversationWithSeller } from "@/services/messaging";
import { getPublicProfile } from "@/services/profile";
import { gridItemStyle, tabContentPadding } from "@/styles/layout";
import type { Listing, UserPost, UserProfile } from "@/types";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200";

function chunkListings(items: Listing[]): Listing[][] {
  const rows: Listing[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [tab, setTab] = useState<"posts" | "listings">("posts");

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (!id) return;

    if (isOwnProfile) {
      router.replace("/(tabs)/profile");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [profile, userPosts, activeListings, counts] = await Promise.all([
          getPublicProfile(id),
          getUserPosts(id),
          getSellerActiveListings(id),
          getFollowCounts(id),
        ]);
        if (cancelled) return;
        setSeller(profile);
        setPosts(userPosts);
        setListings(activeListings);
        setFollowCounts(counts);
        if (user) {
          try {
            const isFollowingSeller = await isFollowing(user.id, id);
            if (!cancelled) setFollowing(isFollowingSeller);
          } catch {
            if (!cancelled) setFollowing(false);
          }
        }
      } catch {
        if (!cancelled) {
          setSeller(null);
          setPosts([]);
          setListings([]);
          setFollowCounts({ followers: 0, following: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isOwnProfile, router, user]);

  const handleMessage = async () => {
    if (!user || !id) {
      router.push("/auth/login");
      return;
    }

    setMessageLoading(true);
    try {
      const listingId = listings[0]?.id ?? null;
      const conversation = await getOrCreateConversationWithSeller({
        buyerId: user.id,
        sellerId: id,
        listingId,
      });
      router.push(`/chat/${conversation.id}`);
    } catch (e) {
      Alert.alert("Message", e instanceof Error ? e.message : "Could not open chat.");
    } finally {
      setMessageLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !id) {
      router.push("/auth/login");
      return;
    }
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(user.id, id);
        setFollowing(false);
        setFollowCounts((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        await followUser(user.id, id);
        setFollowing(true);
        setFollowCounts((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (e) {
      Alert.alert("Follow", e instanceof Error ? e.message : "Could not update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  if (isOwnProfile) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.textPrimary} />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="person-outline"
          title="Seller not found"
          body="This profile may have been removed."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const username = seller.username ?? "seller";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={tabContentPadding(insets.bottom)}
        {...HIDE_SCROLL_INDICATORS}
      >
        <View style={[styles.navBar, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.navTitle}>
            <Text style={styles.navUsername} numberOfLines={1}>
              {username}
            </Text>
            {seller.verified ? (
              <Ionicons name="checkmark-circle" size={16} color="#3897F0" />
            ) : null}
          </View>
        </View>

        <View style={styles.content}>
          <ProfileCard
            fullName={seller.full_name}
            username={username}
            showUsernameInCard={false}
            namePlacement="aboveBio"
            avatarUrl={seller.avatar_url ?? DEFAULT_AVATAR}
            verified={seller.verified}
            verifiedLabel="Verified Seller"
            bio={seller.bio}
            sellerRating={seller.seller_rating}
            posts={posts.length}
            followers={followCounts.followers}
            following={followCounts.following}
            onFollowersPress={() =>
              router.push({
                pathname: "/profile/connections",
                params: { userId: id, type: "followers" },
              })
            }
            onFollowingPress={() =>
              router.push({
                pathname: "/profile/connections",
                params: { userId: id, type: "following" },
              })
            }
            onPostsPress={() => setTab("posts")}
            followAction={{
              following,
              loading: followLoading,
              onPress: handleToggleFollow,
            }}
            onMessagePress={handleMessage}
            messageLoading={messageLoading}
          />

          <ProfileTabs
            tabs={[
              { key: "posts", label: "Posts" },
              { key: "listings", label: "Listings" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <View
            style={[
              profileTabStyles.tabContent,
              tab !== "posts" || !posts.length ? profileTabStyles.tabContentPadded : null,
            ]}
          >
            {tab === "posts" &&
              (posts.length ? (
                <PostGrid posts={posts} variant="compact" flushTop />
              ) : (
                <EmptyState
                  compact
                  icon="images-outline"
                  title="No posts yet"
                  body="This seller hasn't shared any photos yet."
                />
              ))}

            {tab === "listings" &&
              (listings.length ? (
                <View style={styles.grid}>
                  {chunkListings(listings).map((row, rowIndex) => (
                    <View key={row.map((l) => l.id).join("-")} style={styles.gridRow}>
                      {row.map((listing, columnIndex) => (
                        <View key={listing.id} style={gridItemStyle(rowIndex * 2 + columnIndex)}>
                          <WatchCard
                            listing={listing}
                            variant="grid"
                            index={rowIndex * 2 + columnIndex}
                          />
                        </View>
                      ))}
                      {row.length === 1 ? <View style={gridItemStyle(rowIndex * 2 + 1)} /> : null}
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  compact
                  icon="watch-outline"
                  title="No active listings"
                  body="This seller doesn't have any watches listed right now."
                />
              ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.screen,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.screen,
    paddingBottom: 12,
    gap: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  navTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
    paddingRight: SPACING.screen,
  },
  navUsername: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: SPACING.screen,
  },
  grid: {
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: "row",
    gap: GRID_GAP,
  },
});
