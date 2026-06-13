import { useEffect, useState, useCallback } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { AuthenticityPassportCard } from "@/components/AuthenticityPassportCard";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { ListingGallery } from "@/components/ListingGallery";
import { HorizontalListingScroll } from "@/components/HorizontalListingScroll";
import { LuxuryButton } from "@/components/LuxuryButton";
import { MakeOfferModal } from "@/components/OfferModal";
import { PlaceBidModal } from "@/components/PlaceBidModal";
import { AuctionTimer } from "@/components/AuctionTimer";
import { SellerCard } from "@/components/SellerCard";
import { ListingSetIcons } from "@/components/ListingSetIcons";
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
import { useTheme } from "@/hooks/useTheme";
import { getListingById, getRelatedListings } from "@/services/listings";
import { getOrCreateConversation } from "@/services/messaging";
import { getPassportForListing } from "@/services/passport";
import { getAcceptedOfferForListing } from "@/services/offers";
import {
  getAuctionDisplayBid,
  isAuctionEnded,
  isAuctionListing,
  isAuctionLive,
} from "@/lib/auction";
import type { AuthenticityPassport, Listing, ListingOffer } from "@/types";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { colorScheme } = useTheme();
  const isLight = colorScheme === "light";
  const headerButtonVariant = isLight ? "surface" : "overlay";
  const [listing, setListing] = useState<Listing | null>(null);
  const [related, setRelated] = useState<Listing[]>([]);
  const [passport, setPassport] = useState<AuthenticityPassport | null>(null);
  const [acceptedOffer, setAcceptedOffer] = useState<ListingOffer | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const { favorited, toggle } = useFavorite(user?.id, id ?? "", listing?.price);

  const refreshListing = useCallback(() => {
    if (!id) return;
    getListingById(id).then(setListing);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getListingById(id).then((l) => {
      setListing(l);
      if (l) {
        getRelatedListings(l).then(setRelated);
        if (l.authentication_status === "auto_verified") {
          getPassportForListing(l.id).then(setPassport);
        }
      }
    });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    getAcceptedOfferForListing(id, user.id).then(setAcceptedOffer);
  }, [user, id]);

  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: Colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const auction = isAuctionListing(listing);
  const auctionLive = auction && isAuctionLive(listing);
  const auctionEnded = auction && isAuctionEnded(listing);
  const displayPriceCents = auction
    ? getAuctionDisplayBid(listing)
    : acceptedOffer
      ? acceptedOffer.amount
      : listing.price;

  const handleBuyNow = () => {
    if (authLoading) return;

    const checkoutPath = `/checkout?listingId=${listing.id}${acceptedOffer ? `&offerId=${acceptedOffer.id}` : ""}`;

    if (!isAuthenticated) {
      router.push({
        pathname: "/auth/welcome",
        params: { redirect: checkoutPath },
      });
      return;
    }

    router.push({
      pathname: "/checkout",
      params: {
        listingId: listing.id,
        ...(acceptedOffer ? { offerId: acceptedOffer.id } : {}),
      },
    });
  };

  const handleMakeOffer = () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push({
        pathname: "/auth/welcome",
        params: { redirect: `/listing/${listing.id}` },
      });
      return;
    }
    if (user?.id === listing.seller_id) {
      Alert.alert("Your listing", "You cannot offer on your own listing.");
      return;
    }
    setOfferModalVisible(true);
  };

  const handlePlaceBid = () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push({
        pathname: "/auth/welcome",
        params: { redirect: `/listing/${listing.id}` },
      });
      return;
    }
    if (user?.id === listing.seller_id) {
      Alert.alert("Your listing", "You cannot bid on your own listing.");
      return;
    }
    setBidModalVisible(true);
  };

  const handleMessageSeller = async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push({
        pathname: "/auth/welcome",
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
            <Text
              style={{ ...Typography.caption, color: Colors.textMuted, marginTop: 8 }}
              onPress={() => router.push(`/ref/${listing.reference_number}`)}
            >
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

          <View style={{ marginTop: 16, marginBottom: 8 }}>
            <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: 10 }}>
              Included
            </Text>
            <ListingSetIcons listing={listing} />
          </View>

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

          <Text style={{ ...Typography.price, color: Colors.textPrimary, marginBottom: 8 }}>
            {formatPrice(displayPriceCents)}
          </Text>
          {auction ? (
            <View style={{ marginBottom: 16, gap: 8 }}>
              <AuctionTimer listing={listing} />
              <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
                {listing.auction_current_bid != null
                  ? `Current bid · ${listing.auction_bid_count ?? 0} bid${(listing.auction_bid_count ?? 0) === 1 ? "" : "s"}`
                  : `Starting bid · ${formatPrice(listing.auction_starting_bid ?? listing.price)}`}
                {listing.auction_reserve_price
                  ? ` · Reserve ${formatPrice(listing.auction_reserve_price)}`
                  : ""}
              </Text>
            </View>
          ) : acceptedOffer ? (
            <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 24 }}>
              Accepted offer · was {formatPrice(listing.price)}
            </Text>
          ) : (
            <View style={{ marginBottom: 24 }} />
          )}

          {passport ? (
            <View style={{ marginBottom: 24 }}>
              <SectionHeader title="Authenticity Passport" />
              <AuthenticityPassportCard passport={passport} />
            </View>
          ) : null}

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
        <HeaderIconButton variant={headerButtonVariant} icon="chevron-back" onPress={() => router.back()} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <HeaderIconButton
            variant={headerButtonVariant}
            icon="chatbubble-ellipses-outline"
            onPress={handleMessageSeller}
          />
          <HeaderIconButton
            variant={headerButtonVariant}
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
          backgroundColor: isLight ? Colors.background : "rgba(0,0,0,0.9)",
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          flexDirection: "row",
          gap: 12,
        }}
      >
        {auction && user?.id !== listing.seller_id ? (
          <View style={{ flex: 1 }}>
            <LuxuryButton
              label={auctionEnded ? "Auction ended" : "Place Bid"}
              size="large"
              variant="outline"
              onPress={handlePlaceBid}
              disabled={!auctionLive}
            />
          </View>
        ) : (
          <>
            {listing.accepts_offers !== false && user?.id !== listing.seller_id ? (
              <View style={{ flex: 1 }}>
                <LuxuryButton
                  label="Make Offer"
                  variant="ghost"
                  size="large"
                  onPress={handleMakeOffer}
                />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <LuxuryButton
                label={acceptedOffer ? "Checkout" : "Buy Now"}
                size="large"
                variant="outline"
                onPress={handleBuyNow}
              />
            </View>
          </>
        )}
      </View>

      {user && user.id !== listing.seller_id && !auction ? (
        <MakeOfferModal
          visible={offerModalVisible}
          onClose={() => setOfferModalVisible(false)}
          listingId={listing.id}
          listingPrice={listing.price}
          minOfferPrice={listing.min_offer_price}
          buyerId={user.id}
          sellerId={listing.seller_id}
          onOfferCreated={() => setOfferModalVisible(false)}
        />
      ) : null}

      {auction && user && user.id !== listing.seller_id ? (
        <PlaceBidModal
          visible={bidModalVisible}
          onClose={() => setBidModalVisible(false)}
          listing={listing}
          onBidPlaced={refreshListing}
        />
      ) : null}
    </View>
  );
}
