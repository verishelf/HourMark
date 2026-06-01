import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "@/components/Badge";
import { EmptyState, emptyStateSectionStyle } from "@/components/EmptyState";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { MyListingCard } from "@/components/MyListingCard";
import { PostGrid } from "@/components/PostGrid";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileTabs, useProfileTabStyles } from "@/components/ProfileTabs";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsRow } from "@/components/SettingsRow";
import { formatPrice } from "@/lib/stripe";
import { getListingCoverImage } from "@/lib/listingImages";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { CARD_GAP, RADIUS, SPACING, LISTING_CARD_RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { resetToAuth } from "@/lib/navigation";
import { getFavorites } from "@/services/favorites";
import { deleteListing, getUserListings } from "@/services/listings";
import { subscribeContentRefresh, notifyContentRefresh } from "@/lib/contentRefresh";
import { deletePost, getUserPosts } from "@/services/posts";
import { getOrders } from "@/services/payments";
import { deleteAccount, signOut } from "@/services/auth";
import { getFollowCounts } from "@/services/follows";
import {
  getSellerVerificationStatus,
  getVerificationStatusLabel,
} from "@/services/verification";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { tabContentPadding, GRID_GAP } from "@/styles/layout";
import { getCollection } from "@/services/collection";
import { CollectionItemCard } from "@/components/CollectionItemCard";
import type { Listing, Order, UserPost, VerificationStatus, WatchCollectionItem } from "@/types";

type TabKey = "listings" | "posts" | "favorites" | "orders" | "collection";

function chunkListings<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

function ListingGrid({
  listings,
  onEdit,
  onDelete,
  styles,
}: {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (listing: Listing) => void;
  styles: ReturnType<typeof createProfileStyles>;
}) {
  return (
    <View style={styles.listingsGrid}>
      {chunkListings(listings).map((row, rowIndex) => (
        <View key={row.map((listing) => listing.id).join("-")} style={styles.listingsRow}>
          {row.map((listing, columnIndex) => (
            <View key={listing.id} style={styles.listingsGridItem}>
              <MyListingCard
                listing={listing}
                index={rowIndex * 2 + columnIndex}
                onEdit={() => onEdit(listing)}
                onDelete={() => onDelete(listing)}
              />
            </View>
          ))}
          {row.length === 1 ? <View style={styles.listingsGridItem} /> : null}
        </View>
      ))}
    </View>
  );
}

function ListingRow({
  listing,
  styles,
}: {
  listing: Listing;
  styles: ReturnType<typeof createProfileStyles>;
}) {
  const router = useRouter();
  const coverImage = getListingCoverImage(listing.images);

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}
    >
      <View style={styles.listRow}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.listThumb} contentFit="cover" />
        ) : (
          <View style={styles.listThumb} />
        )}
        <View style={styles.listContent}>
          <Text style={styles.brand}>{listing.brand}</Text>
          <Text style={styles.model} numberOfLines={1}>
            {listing.model}
          </Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

function OrderRow({
  order,
  styles,
}: {
  order: Order;
  styles: ReturnType<typeof createProfileStyles>;
}) {
  const router = useRouter();
  const listing = order.listing;
  const coverImage = getListingCoverImage(listing?.images);
  const statusVariant =
    order.status === "completed" ||
    order.status === "delivered" ||
    order.status === "paid" ||
    order.status === "payment_held"
      ? "success"
      : "muted";

  return (
    <Pressable onPress={() => router.push(`/order/${order.id}`)} style={styles.listCard}>
      <View style={styles.listRow}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.listThumb} contentFit="cover" />
        ) : (
          <View style={styles.listThumb} />
        )}
        <View style={styles.listContent}>
          <Text style={styles.brand}>{listing?.brand ?? "Watch"}</Text>
          <Text style={styles.model} numberOfLines={1}>
            {listing?.model ?? `Order #${order.id.slice(0, 8)}`}
          </Text>
          <Text style={styles.price}>{formatPrice(order.amount)}</Text>
          <Badge label={order.status} variant={statusVariant} />
        </View>
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, isAuthenticated, loading, refreshProfile } = useAuth();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [collection, setCollection] = useState<WatchCollectionItem[]>([]);
  const [tab, setTab] = useState<TabKey>("listings");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: "not_started",
    chargesEnabled: false,
    payoutsEnabled: false,
    requirementsDue: [],
    rejectionReason: null,
  });
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { colorScheme } = useTheme();
  const profileTabStyles = useProfileTabStyles();
  const styles = useThemedStyles(createProfileStyles);

  const loadVerificationStatus = useCallback(async () => {
    if (!user) return;
    try {
      const status = await getSellerVerificationStatus();
      setVerificationStatus(status);
      await refreshProfile();
    } catch {
      // Keep profile-derived fallback when API is unavailable.
    }
  }, [refreshProfile, user]);

  const handleStartVerification = () => {
    if (!user) return;
    router.push("/verify?returnPath=profile");
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const loadPosts = useCallback(async () => {
    if (!user) return;
    try {
      setPosts(await getUserPosts(user.id));
    } catch {
      setPosts([]);
    }
  }, [user]);

  const loadListings = useCallback(async () => {
    if (!user) return;
    try {
      setListings(await getUserListings(user.id));
    } catch {
      setListings([]);
    }
  }, [user]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    try {
      setFavorites(await getFavorites(user.id));
    } catch {
      setFavorites([]);
    }
  }, [user]);

  const loadCollection = useCallback(async () => {
    if (!user) return;
    try {
      setCollection(await getCollection(user.id));
    } catch {
      setCollection([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadFavorites();
    void loadCollection();
    getOrders(user.id)
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user, loadFavorites, loadCollection]);

  const refreshProfileData = useCallback(() => {
    loadPosts();
    loadListings();
    loadFavorites();
    loadCollection();
    loadVerificationStatus();
    if (user) {
      getFollowCounts(user.id)
        .then(setFollowCounts)
        .catch(() => setFollowCounts({ followers: 0, following: 0 }));
    }
  }, [loadPosts, loadListings, loadFavorites, loadCollection, loadVerificationStatus, user]);

  useFocusEffect(
    useCallback(() => {
      refreshProfileData();
      return subscribeContentRefresh(refreshProfileData);
    }, [refreshProfileData])
  );

  const handleDeletePost = (post: UserPost) => {
    if (!user) return;
    void (async () => {
      try {
        await deletePost(post.id, user.id);
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        notifyContentRefresh();
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Failed to delete post");
      }
    })();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This permanently removes your profile, listings, posts, messages, and orders from Crownly. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm deletion",
              "Your account will be deleted from our servers immediately.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete account",
                  style: "destructive",
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await deleteAccount();
                      resetToAuth();
                    } catch (e) {
                      Alert.alert(
                        "Error",
                        e instanceof Error ? e.message : "Failed to delete account"
                      );
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDeleteListing = (listing: Listing) => {
    if (!user) return;
    Alert.alert(
      "Delete listing",
      `Remove ${listing.brand} ${listing.model}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteListing(listing.id, user.id);
              setListings((prev) => prev.filter((l) => l.id !== listing.id));
              notifyContentRefresh();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed to delete");
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated && !loading) {
    return (
      <LoggedOutGate
        title="Crownly"
        subtitle="Join the private marketplace for authenticated luxury timepieces."
        backgroundImage={LOGGED_OUT_GATE_IMAGES.profile}
        onSignIn={() => router.push("/auth/welcome")}
        onSignUp={() => router.push("/auth/signup")}
      />
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "listings", label: "Listings" },
    { key: "collection", label: "Collection" },
    { key: "posts", label: "Posts" },
    { key: "favorites", label: "Saved" },
    { key: "orders", label: "Orders" },
  ];

  const verificationLabel = profile?.verified
    ? "Verified"
    : getVerificationStatusLabel(verificationStatus.status);
  const verificationVariant =
    profile?.verified || verificationStatus.status === "verified"
      ? "success"
      : verificationStatus.status === "action_required"
        ? "muted"
        : "muted";

  return (
    <ScrollView
      key={colorScheme}
      style={styles.screen}
      contentContainerStyle={tabContentPadding(insets.bottom)}
      {...HIDE_SCROLL_INDICATORS}
    >
      <ScreenHeader
        title="Profile"
        rightAction={
          <Pressable onPress={handleEditProfile} hitSlop={12} style={styles.editButton}>
            <Text style={styles.editButtonLabel}>Edit</Text>
          </Pressable>
        }
      />

      <View style={styles.content}>
        <View style={{ marginBottom: 24 }}>
        <ProfileCard
          fullName={profile?.full_name}
          username={profile?.username ?? "collector"}
          usernamePlacement="belowAvatar"
          namePlacement="aboveBio"
          avatarUrl={profile?.avatar_url}
          verified={Boolean(profile?.verified)}
          bio={profile?.bio}
          posts={posts.length}
          followers={followCounts.followers}
          following={followCounts.following}
          onPostsPress={() => setTab("posts")}
          onFollowersPress={() =>
            user &&
            router.push({
              pathname: "/profile/connections",
              params: { userId: user.id, type: "followers" },
            })
          }
          onFollowingPress={() =>
            user &&
            router.push({
              pathname: "/profile/connections",
              params: { userId: user.id, type: "following" },
            })
          }
          onAvatarPress={handleEditProfile}
          showAvatarEdit
        />
        </View>

        <ProfileTabs tabs={tabs} active={tab} onChange={setTab} />

        <View
          style={[
            profileTabStyles.tabContent,
            (tab === "listings" || tab === "orders") && profileTabStyles.tabContentListings,
            tab !== "listings" &&
              tab !== "orders" &&
              ((tab === "posts" && posts.length) ||
              (tab === "favorites" && favorites.length)
                ? null
                : profileTabStyles.tabContentPadded),
          ]}
        >
          {tab === "listings" &&
            (listings.length ? (
              <ListingGrid
                listings={listings}
                onEdit={(listing) => router.push(`/listing/edit/${listing.id}`)}
                onDelete={handleDeleteListing}
                styles={styles}
              />
            ) : (
              <View style={emptyStateSectionStyle}>
                <EmptyState
                  compact
                  icon="watch-outline"
                  title="No listings yet"
                  body="List your first timepiece to start selling."
                  actionLabel="List a Watch"
                  onAction={() => router.push("/sell")}
                />
              </View>
            ))}

          {tab === "collection" &&
            (collection.length ? (
              collection.map((item) => (
                <CollectionItemCard key={item.id} item={item} />
              ))
            ) : (
              <View style={emptyStateSectionStyle}>
                <EmptyState
                  compact
                  icon="albums-outline"
                  title="No watches in collection"
                  body="Track value and provenance for watches you own."
                  actionLabel="Add watch"
                  onAction={() => router.push("/collection/add")}
                />
              </View>
            ))}

          {tab === "posts" &&
            (posts.length ? (
              <PostGrid
                posts={posts}
                editable
                variant="compact"
                flushTop
                feedUserId={user?.id}
                onEdit={(post) => router.push(`/post/edit/${post.id}`)}
                onDelete={handleDeletePost}
              />
            ) : (
              <View style={emptyStateSectionStyle}>
                <EmptyState
                  compact
                  icon="images-outline"
                  title="No posts yet"
                  body="Share a photo from the + button on Home."
                  actionLabel="Create Post"
                  onAction={() => router.push("/post/create")}
                />
              </View>
            ))}

          {tab === "favorites" &&
            (favorites.length ? (
              favorites.map((listing) => (
                <ListingRow key={listing.id} listing={listing} styles={styles} />
              ))
            ) : (
              <View style={emptyStateSectionStyle}>
                <EmptyState
                  compact
                  icon="heart-outline"
                  title="Nothing saved yet"
                  body="Tap the heart on any watch to save it here."
                />
              </View>
            ))}

          {tab === "orders" &&
            (orders.length ? (
              orders.map((order) => <OrderRow key={order.id} order={order} styles={styles} />)
            ) : (
              <View style={emptyStateSectionStyle}>
                <EmptyState
                  compact
                  icon="receipt-outline"
                  title="No orders yet"
                  body="Your purchase history will show up here."
                />
              </View>
            ))}
        </View>

        <View style={styles.settingsSection}>
          <SettingsRow
            label="Watch Collection"
            icon="albums-outline"
            subtitle="Track portfolio value and provenance."
            onPress={() => router.push("/collection")}
          />
          <SettingsRow
            label="Saved Search Alerts"
            icon="notifications-outline"
            subtitle="Get notified when verified listings match."
            onPress={() => router.push("/alerts")}
          />
          <SettingsRow
            label="Grail Board"
            icon="search-outline"
            subtitle="Post what you're hunting for."
            onPress={() => router.push("/grails")}
          />
          <SettingsRow
            label="Watch Scanner"
            icon="scan-outline"
            subtitle="Identify watches and see Crownly comps."
            onPress={() => router.push("/scanner")}
          />
          <SettingsRow
            label="Seller Verification"
            icon="shield-checkmark-outline"
            subtitle="Verify your identity (name, address, SSN) and connect payouts to start selling."
            trailing={<Badge label={verificationLabel} variant={verificationVariant} />}
            onPress={handleStartVerification}
          />
          <SettingsRow
            label="Settings"
            icon="settings-outline"
            subtitle="Theme and app preferences."
            onPress={() => router.push("/profile/settings")}
          />
          <SettingsRow
            label="Delete Account"
            icon="trash-outline"
            subtitle="Permanently remove your account and all data."
            onPress={handleDeleteAccount}
            destructive
            loading={deletingAccount}
            disabled={deletingAccount}
          />
          <SettingsRow
            label="Sign Out"
            icon="log-out-outline"
            onPress={async () => {
              if (signingOut) return;
              setSigningOut(true);
              try {
                await signOut();
                resetToAuth();
              } catch (e) {
                Alert.alert("Error", e instanceof Error ? e.message : "Could not sign out");
              } finally {
                setSigningOut(false);
              }
            }}
            destructive
            loading={signingOut}
            disabled={signingOut}
            isLast
          />
        </View>
      </View>
    </ScrollView>
  );
}

function createProfileStyles() {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: SPACING.screen,
  },
  editButton: {
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  editButtonLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  listingsGrid: {
    gap: GRID_GAP,
  },
  listingsRow: {
    flexDirection: "row",
    gap: GRID_GAP,
  },
  listingsGridItem: {
    flex: 1,
    minWidth: 0,
  },
  listCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: LISTING_CARD_RADIUS,
    backgroundColor: Colors.card,
    marginBottom: CARD_GAP,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  listThumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: Colors.cardElevated,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 0,
    gap: 2,
  },
  brand: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  model: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  price: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  settingsSection: {
    marginTop: SPACING.section,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.card,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  });
}
