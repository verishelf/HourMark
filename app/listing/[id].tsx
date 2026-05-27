import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ListingGallery } from "@/components/ListingGallery";
import { LuxuryButton } from "@/components/LuxuryButton";
import { SellerCard } from "@/components/SellerCard";
import { WatchCard } from "@/components/WatchCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors } from "@/constants/colors";
import { CARD_GAP } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { formatPrice } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import { getListingById, getRelatedListings } from "@/services/listings";
import type { Listing } from "@/types";

function FixedHeaderButton({
  onPress,
  icon,
  filled,
}: {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  filled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.overlay,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={icon}
        size={22}
        color={filled ? Colors.textPrimary : Colors.textSecondary}
      />
    </Pressable>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [related, setRelated] = useState<Listing[]>([]);
  const { favorited, toggle } = useFavorite(user?.id, id ?? "");

  useEffect(() => {
    if (!id) return;
    getListingById(id).then((l) => {
      setListing(l);
      if (l) getRelatedListings(l).then(setRelated);
    });
  }, [id]);

  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: Colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <ListingGallery images={listing.images} />

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ ...Typography.label, color: Colors.textSecondary }}>
            {listing.brand}
          </Text>
          <Text style={{ ...Typography.hero, color: Colors.textPrimary, fontSize: 36, marginTop: 4 }}>
            {listing.model}
          </Text>
          {listing.reference_number && (
            <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: 8 }}>
              Ref. {listing.reference_number} · {listing.year}
            </Text>
          )}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 24 }}>
            {listing.authenticated && (
              <View style={{ borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>Authenticated</Text>
              </View>
            )}
            <View style={{ borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>{listing.condition}</Text>
            </View>
          </View>

          <Text style={{ ...Typography.price, color: Colors.textPrimary, marginBottom: 32 }}>
            {formatPrice(listing.price)}
          </Text>

          {listing.description && (
            <>
              <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: 12 }}>Description</Text>
              <Text style={{ ...Typography.body, color: Colors.textSecondary, marginBottom: 32, lineHeight: 26 }}>
                {listing.description}
              </Text>
            </>
          )}

          {listing.seller && (
            <View style={{ marginBottom: 16 }}>
              <SectionHeader title="Seller" />
              <SellerCard seller={listing.seller} />
            </View>
          )}

          {related.length > 0 && (
            <View style={{ marginTop: 40, paddingTop: 8, gap: CARD_GAP }}>
              <SectionHeader title="You May Also Like" />
              {related.map((l, i) => (
                <WatchCard key={l.id} listing={l} variant="compact" index={i} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <FixedHeaderButton icon="chevron-back" onPress={() => router.back()} />
        <FixedHeaderButton
          icon={favorited ? "heart" : "heart-outline"}
          filled={favorited}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggle();
          }}
        />
      </View>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 16,
          backgroundColor: "rgba(0,0,0,0.9)",
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <LuxuryButton
          label="Buy Now"
          onPress={() =>
            router.push({
              pathname: "/checkout",
              params: { listingId: listing.id },
            })
          }
        />
      </View>
    </View>
  );
}
