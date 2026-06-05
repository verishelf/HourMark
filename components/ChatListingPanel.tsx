import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { OfferActionRow } from "@/components/OfferModal";
import { SwipeToDeleteRow } from "@/components/SwipeToDeleteRow";
import { Colors } from "@/constants/colors";
import { LISTING_CARD_RADIUS, RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getListingCoverImage } from "@/lib/listingImages";
import { formatPrice } from "@/lib/stripe";
import { removeOffer } from "@/services/offers";
import type { Listing, ListingOffer } from "@/types";

type Props = {
  listing: Listing;
  offers: ListingOffer[];
  userId: string;
  onOffersChange: (offers: ListingOffer[]) => void;
};

function createStyles() {
  return StyleSheet.create({
    panel: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: SPACING.screen,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 12,
    },
    listingCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: LISTING_CARD_RADIUS,
      backgroundColor: Colors.card,
      padding: 12,
      gap: 12,
    },
    listingThumb: {
      width: 64,
      height: 64,
      borderRadius: RADIUS.sm,
      backgroundColor: Colors.cardElevated,
    },
    listingBrand: {
      ...Typography.label,
      color: Colors.textSecondary,
      fontSize: 10,
    },
    listingModel: {
      ...Typography.h3,
      color: Colors.textPrimary,
      fontSize: 15,
      lineHeight: 20,
    },
    listingPrice: {
      ...Typography.price,
      color: Colors.textPrimary,
      fontSize: 14,
      marginTop: 4,
    },
    offersLabel: {
      ...Typography.label,
      color: Colors.textMuted,
      marginBottom: 4,
    },
    offersList: {
      maxHeight: 220,
    },
    offerWrap: {
      marginBottom: 8,
    },
  });
}

export function ChatListingPanel({ listing, offers, userId, onOffersChange }: Props) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const coverImage = getListingCoverImage(listing.images);
  const isSeller = userId === listing.seller_id;

  const confirmDeleteOffer = (offer: ListingOffer) => {
    if (offer.status === "accepted") {
      Alert.alert(
        "Offer accepted",
        "This offer is tied to checkout and cannot be removed."
      );
      return;
    }

    const isPending = offer.status === "pending";
    const message = isPending
      ? isSeller
        ? "Decline this offer?"
        : "Withdraw your offer?"
      : "Remove this offer from the conversation?";

    Alert.alert("Delete offer", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const previous = offers;
          onOffersChange(offers.filter((o) => o.id !== offer.id));
          try {
            await removeOffer(offer.id, userId);
          } catch (e) {
            onOffersChange(previous);
            Alert.alert("Error", e instanceof Error ? e.message : "Could not remove offer");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.panel}>
      <Pressable
        style={styles.listingCard}
        onPress={() => router.push(`/listing/${listing.id}`)}
      >
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.listingThumb} contentFit="cover" />
        ) : (
          <View style={styles.listingThumb} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.listingBrand}>{listing.brand}</Text>
          <Text style={styles.listingModel} numberOfLines={2}>
            {listing.model}
          </Text>
          <Text style={styles.listingPrice}>{formatPrice(listing.price)}</Text>
        </View>
      </Pressable>

      {offers.length > 0 ? (
        <View>
          <Text style={styles.offersLabel}>Offers</Text>
          <ScrollView
            style={styles.offersList}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {offers.map((offer) => (
              <View key={offer.id} style={styles.offerWrap}>
                <SwipeToDeleteRow onDelete={() => confirmDeleteOffer(offer)}>
                  <OfferActionRow
                    offer={offer}
                    isSeller={userId === offer.seller_id}
                    onUpdate={(updated) =>
                      onOffersChange(
                        offers.map((o) => (o.id === updated.id ? updated : o))
                      )
                    }
                  />
                </SwipeToDeleteRow>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
