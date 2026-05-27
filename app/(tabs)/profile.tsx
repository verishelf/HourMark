import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { LuxuryButton } from "@/components/LuxuryButton";
import { MyListingCard } from "@/components/MyListingCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatPrice } from "@/lib/stripe";
import { getListingCoverImage } from "@/lib/listingImages";
import { Colors } from "@/constants/colors";
import { CARD_GAP, RADIUS, SPACING, LISTING_CARD_RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { getFavorites } from "@/services/favorites";
import { deleteListing, getUserListings } from "@/services/listings";
import { getOrders, createConnectAccountLink } from "@/services/payments";
import { signOut } from "@/services/auth";
import { GRID_GAP, tabContentPadding } from "@/styles/layout";
import type { Listing, Order } from "@/types";

type TabKey = "listings" | "favorites" | "orders";

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
}: {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (listing: Listing) => void;
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

function ProfileHeader({
  username,
  avatarUrl,
  verified,
  bio,
}: {
  username: string;
  avatarUrl: string;
  verified: boolean;
  bio?: string | null;
}) {
  return (
    <View style={styles.header}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      <View style={styles.headerMeta}>
        <Text style={styles.username} numberOfLines={1}>
          @{username}
        </Text>
        {verified ? <Badge label="Verified" variant="success" /> : null}
        {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      </View>
    </View>
  );
}

function ProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: TabKey; label: string }[];
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  return (
    <View style={styles.tabsRow}>
      {tabs.map((t) => {
        const selected = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.tabButton, selected && styles.tabButtonActive]}
          >
            <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingsRow({
  label,
  icon,
  onPress,
  destructive,
  isLast,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  const color = destructive ? Colors.error : Colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, !isLast && styles.settingsRowBorder]}
    >
      <View style={styles.settingsRow}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.settingsLabel, { color }]}>{label}</Text>
        {!destructive && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
      </View>
    </Pressable>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
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

function OrderRow({ order }: { order: Order }) {
  const listing = order.listing;
  const coverImage = getListingCoverImage(listing?.images);
  const statusVariant =
    order.status === "delivered" || order.status === "paid" ? "success" : "muted";

  return (
    <View style={styles.listCard}>
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
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, isAuthenticated, loading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<TabKey>("listings");

  const loadListings = useCallback(async () => {
    if (!user) return;
    setListings(await getUserListings(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getFavorites(user.id).then(setFavorites);
    getOrders(user.id).then(setOrders);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [loadListings])
  );

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
      <View style={styles.screen}>
        <ScreenHeader
          title="Profile"
          subtitle="The luxury watch marketplace for discerning collectors."
        />
        <View style={styles.content}>
          <LuxuryButton label="Sign In" onPress={() => router.push("/auth/login")} variant="primary" />
          <View style={styles.buttonGap} />
          <LuxuryButton
            label="Create Account"
            onPress={() => router.push("/auth/signup")}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "listings", label: "Listings" },
    { key: "favorites", label: "Saved" },
    { key: "orders", label: "Orders" },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={tabContentPadding(insets.bottom)}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Profile" />

      <View style={styles.content}>
        <ProfileHeader
          username={profile?.username ?? "collector"}
          avatarUrl={
            profile?.avatar_url ??
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"
          }
          verified={Boolean(profile?.verified)}
          bio={profile?.bio}
        />

        <ProfileTabs tabs={tabs} active={tab} onChange={setTab} />

        <View style={styles.tabContent}>
          {tab === "listings" &&
            (listings.length ? (
              <ListingGrid
                listings={listings}
                onEdit={(listing) => router.push(`/listing/edit/${listing.id}`)}
                onDelete={handleDeleteListing}
              />
            ) : (
              <EmptyState
                compact
                icon="watch-outline"
                title="No listings yet"
                body="List your first timepiece to start selling."
                actionLabel="List a Watch"
                onAction={() => router.push("/sell")}
              />
            ))}

          {tab === "favorites" &&
            (favorites.length ? (
              favorites.map((listing) => <ListingRow key={listing.id} listing={listing} />)
            ) : (
              <EmptyState
                compact
                icon="heart-outline"
                title="Nothing saved yet"
                body="Tap the heart on any watch to save it here."
              />
            ))}

          {tab === "orders" &&
            (orders.length ? (
              orders.map((order) => <OrderRow key={order.id} order={order} />)
            ) : (
              <EmptyState
                compact
                icon="receipt-outline"
                title="No orders yet"
                body="Your purchase history will show up here."
              />
            ))}
        </View>

        <View style={styles.settingsSection}>
          <SettingsRow
            label="Payout Settings"
            icon="card-outline"
            onPress={async () => {
              if (!user) return;
              const url = await createConnectAccountLink(user.id, Linking.createURL("/profile"));
              Linking.openURL(url);
            }}
          />
          <SettingsRow label="Verify Identity" icon="shield-checkmark-outline" onPress={() => {}} />
          <SettingsRow
            label="Sign Out"
            icon="log-out-outline"
            onPress={async () => {
              await signOut();
              router.replace("/auth/login");
            }}
            destructive
            isLast
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: SPACING.screen,
  },
  buttonGap: {
    height: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerMeta: {
    flex: 1,
    marginLeft: 14,
    gap: 6,
  },
  username: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontSize: 20,
    lineHeight: 26,
  },
  bio: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabButtonActive: {
    borderBottomColor: Colors.textPrimary,
  },
  tabLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "400",
    fontSize: 13,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  tabContent: {
    minHeight: 100,
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
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
  },
});
