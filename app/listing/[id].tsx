import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { ListingGallery } from "@/components/ListingGallery";
import { HorizontalListingScroll } from "@/components/HorizontalListingScroll";
import { LuxuryButton } from "@/components/LuxuryButton";
import { SellerCard } from "@/components/SellerCard";
import { TrustBadgeRow } from "@/components/TrustBadgeRow";
import { TrustScoreIndicator } from "@/components/TrustScoreIndicator";
import { FraudWarningBanner } from "@/components/FraudWarningBanner";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { CARD_GAP } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { formatPrice } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import { getListingById, getRelatedListings } from "@/services/listings";
import { getOrCreateConversation } from "@/services/messaging";
import type { Listing } from "@/types";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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

  const handleBuyNow = () => {
    if (authLoading) return;

    const checkoutPath = `/checkout?listingId=${listing.id}`;

    if (!isAuthenticated) {
      router.push({
        pathname: "/auth/login",
        params: { redirect: checkoutPath },
      });
      return;
    }

    router.push({
      pathname: "/checkout",
      params: { listingId: listing.id },
    });
  };

  const handleMessageSeller = async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push({
        pathname: "/auth/login",
        params: { redirect: `/listing/${listing.id}` },
      });
      return;
    }

    if (!user || user.id === listing.seller_id) {
      if (user?.id === listing.seller_id) {
        Alert.alert("Your listing", "You cannot message yourself.");
      }
      return;
    }

    try {
      const conversation = await getOrCreateConversation({
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.seller_id,
      });
      router.push(`/chat/${conversation.id}`);
    } catch (e) {
      Alert.alert("Message Seller", e instanceof Error ? e.message : "Could not open chat.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View style={{ position: "relative" }}>
          <ListingGallery images={listing.images} />
        </View>

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

          <View style={{ marginTop: 16, marginBottom: 12 }}>
            <TrustBadgeRow badges={listing.trust_badges} />
          </View>

          {listing.ai_trust_score != null && listing.ai_trust_score > 0 && (
            <View style={{ marginBottom: 20 }}>
              <TrustScoreIndicator score={listing.ai_trust_score} />
            </View>
          )}

          <FraudWarningBanner flags={listing.fraud_flags} />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 12, marginBottom: 24 }}>
            {listing.authenticated && (
              <View style={{ borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>AI Authenticated</Text>
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
              <SellerCard
                seller={listing.seller}
                onPress={() => router.push(`/seller/${listing.seller_id}`)}
              />
            </View>
          )}

          {related.length > 0 && (
            <View style={{ marginTop: 40, marginHorizontal: -20 }}>
              <View style={{ paddingHorizontal: 20, marginBottom: CARD_GAP }}>
                <SectionHeader title="You May Also Like" />
              </View>
              <HorizontalListingScroll
                listings={related}
                contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
              />
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
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <HeaderIconButton icon="chatbubble-ellipses-outline" onPress={handleMessageSeller} />
          <HeaderIconButton
            icon={favorited ? "heart" : "heart-outline"}
            filled={favorited}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggle();
            }}
          />
        </View>
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
        <LuxuryButton label="Buy Now" size="large" onPress={handleBuyNow} />
      </View>
    </View>
  );
}
