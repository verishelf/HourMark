import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { LuxuryButton } from "@/components/LuxuryButton";
import { OfferActionRow } from "@/components/OfferModal";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { formatPrice } from "@/lib/stripe";
import { getOfferById, respondToOffer } from "@/services/offers";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { ListingOffer } from "@/types";

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [offer, setOffer] = useState<ListingOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setOffer(await getOfferById(id));
    } catch {
      setOffer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const listing = offer?.listing;
  const isSeller = Boolean(user && offer && user.id === offer.seller_id);
  const isBuyer = Boolean(user && offer && user.id === offer.buyer_id);
  const buyerName = offer?.buyer?.username ?? "Buyer";

  const handleRespond = async (action: "accept" | "decline") => {
    if (!offer || !user) return;
    setResponding(true);
    try {
      const updated = await respondToOffer(offer.id, user.id, action);
      setOffer(updated);
      Alert.alert(
        action === "accept" ? "Offer accepted" : "Offer declined",
        action === "accept"
          ? "The buyer can now checkout at the accepted price."
          : "The buyer has been notified."
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update offer");
    } finally {
      setResponding(false);
    }
  };

  const headerSubtitle = listing
    ? `${listing.brand} ${listing.model}`
    : "Review offer details";

  if (loading) {
    return (
      <FeatureScreenScaffold title="Offer" subtitle={headerSubtitle}>
        <Text style={styles.rowMeta}>Loading…</Text>
      </FeatureScreenScaffold>
    );
  }

  if (!offer) {
    return (
      <FeatureScreenScaffold title="Offer" subtitle="Offer not found">
        <EmptyState
          icon="pricetag-outline"
          title="Offer unavailable"
          body="This offer may have been withdrawn or removed."
        />
      </FeatureScreenScaffold>
    );
  }

  return (
    <FeatureScreenScaffold title="Offer" subtitle={headerSubtitle}>
      <View style={styles.card}>
        <Text style={styles.label}>Offer amount</Text>
        <Text style={styles.offerAmount}>{formatPrice(offer.amount)}</Text>
        {listing ? (
          <Text style={styles.rowBody}>
            Asking price {formatPrice(listing.price)}
          </Text>
        ) : null}
        {offer.message ? (
          <Text style={[styles.rowBody, { marginTop: 12 }]}>{offer.message}</Text>
        ) : null}
        <Text style={[styles.rowMeta, { marginTop: 12 }]}>
          {isSeller ? `From @${buyerName}` : "Your offer"}
          {" · "}
          {new Date(offer.created_at).toLocaleString()}
        </Text>
      </View>

      {listing ? (
        <Pressable
          style={styles.listRow}
          onPress={() => router.push(`/listing/${listing.id}`)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>
              {listing.brand} {listing.model}
            </Text>
            <Text style={styles.rowBody}>View listing</Text>
          </View>
          <Text style={styles.linkText}>Open</Text>
        </Pressable>
      ) : null}

      {isSeller && offer.status === "pending" ? (
        <View style={{ gap: 12, marginTop: 8, marginBottom: 16 }}>
          <LuxuryButton
            label={responding ? "Accepting…" : "Accept offer"}
            onPress={() => handleRespond("accept")}
            disabled={responding}
          />
          <LuxuryButton
            label="Decline offer"
            variant="outline"
            onPress={() => handleRespond("decline")}
            disabled={responding}
          />
        </View>
      ) : (
        <View style={{ marginTop: 8, marginBottom: 16 }}>
          <OfferActionRow
            offer={offer}
            isSeller={isSeller}
            onUpdate={(updated) => {
              setOffer(updated);
              if (updated.status === "accepted" && isBuyer) {
                Alert.alert(
                  "Offer accepted",
                  "You can complete checkout at the accepted price.",
                  [
                    { text: "Later", style: "cancel" },
                    {
                      text: "Checkout",
                      onPress: () =>
                        router.push({
                          pathname: "/checkout",
                          params: { listingId: updated.listing_id, offerId: updated.id },
                        }),
                    },
                  ]
                );
              }
            }}
          />
        </View>
      )}

      {offer.status === "accepted" && isBuyer && listing ? (
        <LuxuryButton
          label="Checkout at offer price"
          onPress={() =>
            router.push({
              pathname: "/checkout",
              params: { listingId: listing.id, offerId: offer.id },
            })
          }
        />
      ) : null}

      {offer.conversation_id && (isSeller || isBuyer) ? (
        <LuxuryButton
          label="Open conversation"
          variant="secondary"
          onPress={() => router.push(`/chat/${offer.conversation_id}`)}
        />
      ) : null}
    </FeatureScreenScaffold>
  );
}
