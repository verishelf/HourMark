import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchCard } from "@/components/WatchCard";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { GRID_GAP, RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { getSellerActiveListings } from "@/services/listings";
import { getPublicProfile } from "@/services/profile";
import { gridItemStyle, tabContentPadding } from "@/styles/layout";
import type { Listing, UserProfile } from "@/types";

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
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

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
        const [profile, activeListings] = await Promise.all([
          getPublicProfile(id),
          getSellerActiveListings(id),
        ]);
        if (cancelled) return;
        setSeller(profile);
        setListings(activeListings);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isOwnProfile, router]);

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
        <ScreenHeader
          title="Seller"
          rightAction={
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          }
        />

        <View style={styles.content}>
          <View style={styles.profileCard}>
            <Image
              source={{ uri: seller.avatar_url ?? DEFAULT_AVATAR }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.profileMeta}>
              <Text style={styles.username}>@{username}</Text>
              {seller.verified ? <Badge label="Verified Seller" variant="success" /> : null}
              {seller.bio ? <Text style={styles.bio}>{seller.bio}</Text> : null}
              {seller.seller_rating != null ? (
                <Text style={styles.rating}>{seller.seller_rating.toFixed(1)} seller rating</Text>
              ) : null}
            </View>
          </View>

          <SectionHeader
            title="Listings"
            subtitle={`${listings.length} watch${listings.length === 1 ? "" : "es"} for sale`}
          />

          {listings.length ? (
            <View style={styles.grid}>
              {chunkListings(listings).map((row, rowIndex) => (
                <View key={row.map((l) => l.id).join("-")} style={styles.gridRow}>
                  {row.map((listing, columnIndex) => (
                    <View key={listing.id} style={gridItemStyle(rowIndex * 2 + columnIndex)}>
                      <WatchCard listing={listing} variant="grid" index={rowIndex * 2 + columnIndex} />
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
          )}
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
  content: {
    paddingHorizontal: SPACING.screen,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.card,
    padding: 16,
    marginBottom: SPACING.section,
    gap: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileMeta: {
    flex: 1,
    gap: 8,
    minWidth: 0,
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
  rating: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  grid: {
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: "row",
    gap: GRID_GAP,
  },
});
