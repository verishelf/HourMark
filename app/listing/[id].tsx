import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ListingGallery } from "@/components/ListingGallery";
import { LuxuryButton } from "@/components/LuxuryButton";
import { SellerCard } from "@/components/SellerCard";
import { WatchCard } from "@/components/WatchCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { formatPrice } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import { getListingById, getRelatedListings } from "@/services/listings";
import type { Listing } from "@/types";

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

        <Pressable
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: insets.top + 12,
            left: 20,
            padding: 8,
          }}
        >
          <Text style={{ color: Colors.textPrimary, fontSize: 24 }}>←</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggle();
          }}
          style={{
            position: "absolute",
            top: insets.top + 12,
            right: 20,
            padding: 8,
          }}
        >
          <Text style={{ color: Colors.textPrimary, fontSize: 22 }}>
            {favorited ? "♥" : "♡"}
          </Text>
        </Pressable>

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
            <>
              <SectionHeader title="Seller" />
              <SellerCard seller={listing.seller} />
            </>
          )}

          <SectionHeader title="You May Also Like" />
          {related.map((l, i) => (
            <WatchCard key={l.id} listing={l} variant="compact" index={i} />
          ))}
        </View>
      </ScrollView>

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
