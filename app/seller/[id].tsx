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
import { EmptyState, emptyStateSectionStyle } from "@/components/EmptyState";
import { ProfileCard } from "@/components/ProfileCard";
import { CollectionItemCard } from "@/components/CollectionItemCard";
import { PostGrid } from "@/components/PostGrid";
import { ProfileTabs, useProfileTabStyles } from "@/components/ProfileTabs";
import { WatchCard } from "@/components/WatchCard";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
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
import { gridItemStyle, tabContentPadding, GRID_GAP } from "@/styles/layout";
import { getSellerReviews, isTrustedSeller } from "@/services/reviews";
import { getCollection } from "@/services/collection";
import type { Listing, SellerReview, UserPost, UserProfile, WatchCollectionItem } from "@/types";

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
  const [tab, setTab] = useState<"listings" | "posts" | "collection">("listings");
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [collection, setCollection] = useState<WatchCollectionItem[]>([]);
  const profileTabStyles = useProfileTabStyles();
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(createSellerProfileStyles);

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
        const [profile, userPosts, activeListings, counts, sellerReviews, sellerCollection] =
          await Promise.all([
          getPublicProfile(id),
          getUserPosts(id),
          getSellerActiveListings(id),
          getFollowCounts(id),
          getSellerReviews(id),
          getCollection(id),
        ]);
        if (cancelled) return;
        setSeller(profile);
        setPosts(userPosts);
        setListings(activeListings);
        setFollowCounts(counts);
        setReviews(sellerReviews);
        setCollection(sellerCollection);
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
      router.push("/auth/welcome");
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
      router.push("/auth/welcome");
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
          fill
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
        key={colorScheme}
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
            avatarUrl={seller.avatar_url}
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

          {seller.seller_rating != null && seller.seller_rating > 0 ? (
            <Text style={styles.ratingLine}>
              ★ {seller.seller_rating.toFixed(1)}
              {seller.seller_review_count ? ` · ${seller.seller_review_count} reviews` : ""}
              {isTrustedSeller(seller) ? " · Trusted Seller" : ""}
            </Text>
          ) : null}

          <ProfileTabs
            tabs={[
              { key: "listings", label: "Listings" },
              { key: "posts", label: "Posts" },
              { key: "collection", label: "Collection" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <View
            style={[
              profileTabStyles.tabContent,
              tab === "listings" && profileTabStyles.tabContentListings,
              tab !== "listings" &&
                (tab === "posts" && posts.length ? null : profileTabStyles.tabContentPadded),
            ]}
          >
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
                <View style={emptyStateSectionStyle}>
                  <EmptyState
                    compact
                    icon="watch-outline"
                    title="No active listings"
                    body="This seller doesn't have any watches listed right now."
                  />
                </View>
              ))}

            {tab === "posts" &&
              (posts.length ? (
                <PostGrid posts={posts} variant="compact" flushTop feedUserId={id} />
              ) : (
                <EmptyState
                  compact
                  icon="images-outline"
                  title="No posts yet"
                  body="This seller hasn't shared any photos yet."
                />
              ))}

            {tab === "collection" &&
              (collection.length ? (
                collection.map((item) => <CollectionItemCard key={item.id} item={item} />)
              ) : (
                <EmptyState
                  compact
                  icon="albums-outline"
                  title="No collection shared"
                  body="This collector hasn't added watches to their collection yet."
                />
              ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createSellerProfileStyles() {
  return StyleSheet.create({
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
    ratingLine: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginBottom: 8,
      paddingHorizontal: SPACING.screen,
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
}
