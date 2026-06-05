import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { EscrowProgressTracker, getEscrowStepIndex } from "@/components/EscrowProgressTracker";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { LuxuryButton } from "@/components/LuxuryButton";
import { SellerReviewForm } from "@/components/SellerReviewForm";
import { ORDER_ESCROW_BACKGROUND } from "@/constants/orderImages";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useAuth } from "@/hooks/useAuth";
import { getListingCoverImage } from "@/lib/listingImages";
import { formatPrice } from "@/lib/stripe";
import { confirmDelivery, releaseEscrow, updateOrderTracking, openOrderDispute, cancelOrder, canCancelOrder } from "@/services/escrow";
import { getOrderById } from "@/services/payments";
import { getReviewForOrder } from "@/services/reviews";
import { addOrderToCollection } from "@/services/collection";
import { transferPassportToBuyer } from "@/services/passport";
import type { Order } from "@/types";
import type { SellerReview } from "@/types";

function formatStatus(status: Order["status"]): string {
  return status.replace(/_/g, " ");
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [review, setReview] = useState<SellerReview | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      getOrderById(id).then((loaded) => {
        setOrder(loaded);
        if (loaded?.tracking_number) setTracking(loaded.tracking_number);
        if (loaded?.carrier) setCarrier(loaded.carrier);
      });
      getReviewForOrder(id).then(setReview);
    }
  }, [id]);

  if (!order) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading order…</Text>
      </View>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;
  const listing = order.listing;
  const coverImage = getListingCoverImage(listing?.images) ?? ORDER_ESCROW_BACKGROUND;
  const stepIndex = getEscrowStepIndex(order.status);

  const handleShip = async () => {
    try {
      const status = await updateOrderTracking(order.id, tracking, carrier || undefined);
      setOrder({ ...order, status, tracking_number: tracking, carrier: carrier || null });
      Alert.alert("Shipped", "Tracking saved. Buyer will confirm delivery.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  };

  const handleConfirmDelivery = async () => {
    try {
      const status = await confirmDelivery(order.id);
      const refreshed = await getOrderById(order.id);
      if (refreshed) setOrder(refreshed);
      else setOrder({ ...order, status });
      Alert.alert("Delivery confirmed", "3-day inspection period started.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  };

  const handleRelease = async () => {
    try {
      await releaseEscrow(order.id);
      const refreshed = await getOrderById(order.id);
      if (refreshed) {
        setOrder(refreshed);
        if (user) {
          await transferPassportToBuyer(order.listing_id, user.id);
          await addOrderToCollection(user.id, refreshed);
        }
      }
      Alert.alert("Complete", "Funds released to seller.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      Alert.alert("Required", "Describe the issue with your order.");
      return;
    }
    try {
      await openOrderDispute(order.id, disputeReason.trim());
      const refreshed = await getOrderById(order.id);
      if (refreshed) setOrder(refreshed);
      Alert.alert("Dispute opened", "Our team will review within 24 hours.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel order?",
      order.payment_method === "wire_transfer"
        ? "This will cancel your wire transfer request and return the listing to the marketplace."
        : "This will cancel checkout before payment is processed. You can purchase again later.",
      [
        { text: "Keep order", style: "cancel" },
        {
          text: "Cancel order",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelOrder(order.id);
              const refreshed = await getOrderById(order.id);
              setOrder(refreshed ?? { ...order, status });
              Alert.alert("Order cancelled", "Your order has been cancelled.");
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed to cancel order");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const paymentDetail =
    order.status === "cancelled"
      ? "Cancelled"
      : canCancelOrder(order)
        ? order.payment_method === "wire_transfer"
          ? "Wire transfer · Awaiting payment"
          : "Card · Awaiting payment"
        : order.payment_method === "wire_transfer"
          ? "Wire transfer"
          : "Card · Escrow held";

  return (
    <View style={styles.screen}>
      <Image source={{ uri: coverImage }} style={styles.backgroundImage} contentFit="cover" blurRadius={18} />
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.82)", Colors.background]}
        locations={[0, 0.42, 0.88]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <HeaderIconButton variant="overlay" icon="chevron-back" onPress={() => router.back()} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>ORDER & ESCROW</Text>
          <Text style={styles.heroTitle}>
            {listing ? `${listing.brand} ${listing.model}` : "Your purchase"}
          </Text>
          <Text style={styles.heroSubtitle}>
            Order #{order.id.slice(0, 8).toUpperCase()} · {formatStatus(order.status)}
          </Text>

          <View style={styles.listingCard}>
            <Image source={{ uri: coverImage }} style={styles.listingImage} contentFit="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.88)"]}
              style={styles.listingGradient}
            />
            <View style={styles.listingMeta}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.listingBrand}>{listing?.brand ?? "Timepiece"}</Text>
                <Text style={styles.listingModel} numberOfLines={2}>
                  {listing?.model ?? "Luxury watch purchase"}
                </Text>
              </View>
              <Text style={styles.listingPrice}>{formatPrice(order.amount)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineSection}>
          <EscrowProgressTracker
            status={order.status}
            inspectionEndsAt={order.inspection_ends_at}
            listing={listing}
          />
        </View>

        <View style={styles.detailsCard}>
          <DetailRow
            icon="card-outline"
            label="Payment"
            value={paymentDetail}
          />
          <DetailRow
            icon="calendar-outline"
            label="Placed"
            value={new Date(order.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
          {order.tracking_number ? (
            <DetailRow icon="locate-outline" label="Tracking" value={order.tracking_number} />
          ) : null}
          {order.carrier ? (
            <DetailRow icon="airplane-outline" label="Carrier" value={order.carrier} />
          ) : null}
          <DetailRow
            icon="analytics-outline"
            label="Progress"
            value={`Step ${Math.max(stepIndex + 1, 1)} of 5`}
          />
        </View>

        {isBuyer && canCancelOrder(order) ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Cancel order</Text>
            <Text style={styles.actionBody}>
              {order.payment_method === "wire_transfer"
                ? "Changed your mind before sending the wire? Cancel to release the listing back to the seller."
                : "Payment has not been processed yet. You can cancel and return to checkout later."}
            </Text>
            <LuxuryButton
              label="Cancel order"
              variant="ghost"
              loading={cancelling}
              onPress={handleCancelOrder}
            />
          </View>
        ) : null}

        {isSeller && ["payment_held", "paid"].includes(order.status) ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Ship to buyer</Text>
            <Text style={styles.actionBody}>
              Add a carrier tracking number once the watch is on its way.
            </Text>
            <TextInput
              value={tracking}
              onChangeText={setTracking}
              placeholder="Carrier tracking number"
              placeholderTextColor={Colors.textMuted}
              style={styles.trackingInput}
            />
            <TextInput
              value={carrier}
              onChangeText={setCarrier}
              placeholder="Carrier (FedEx, UPS, etc.)"
              placeholderTextColor={Colors.textMuted}
              style={styles.trackingInput}
            />
            <LuxuryButton label="Mark shipped" onPress={handleShip} />
          </View>
        ) : null}

        {isBuyer && order.status === "shipped" ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Confirm delivery</Text>
            <Text style={styles.actionBody}>
              Once your watch arrives, confirm delivery to start the 3-day inspection window.
            </Text>
            <LuxuryButton label="Confirm delivery" onPress={handleConfirmDelivery} />
          </View>
        ) : null}

        {isBuyer && order.status === "inspection_period" ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Release funds</Text>
            <Text style={styles.actionBody}>
              Satisfied with your timepiece? Release escrow to complete the purchase.
            </Text>
            <LuxuryButton label="Release funds to seller" onPress={handleRelease} />
            <Text style={[styles.actionBody, { marginTop: 12 }]}>
              Not as described? Open a dispute during your inspection window.
            </Text>
            <TextInput
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Describe the issue…"
              placeholderTextColor={Colors.textMuted}
              style={styles.trackingInput}
              multiline
            />
            <LuxuryButton label="Open dispute" variant="ghost" onPress={handleDispute} />
          </View>
        ) : null}

        {isBuyer && order.status === "completed" && !review && user ? (
          <View style={[styles.actionCard, { marginBottom: 16 }]}>
            <SellerReviewForm
              orderId={order.id}
              reviewerId={user.id}
              sellerId={order.seller_id}
              onSubmitted={() => getReviewForOrder(order.id).then(setReview)}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const LISTING_CARD_HEIGHT = 220;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    paddingHorizontal: SPACING.screen,
  },
  hero: {
    paddingHorizontal: SPACING.screen,
    paddingTop: 8,
    gap: 8,
  },
  eyebrow: {
    ...Typography.caption,
    color: Colors.textSecondary,
    letterSpacing: 1.4,
    fontSize: 11,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
  },
  heroSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: "capitalize",
    marginBottom: 8,
  },
  listingCard: {
    height: LISTING_CARD_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.card,
  },
  listingImage: {
    ...StyleSheet.absoluteFillObject,
  },
  listingGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  listingMeta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    padding: 16,
  },
  listingBrand: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 10,
    marginBottom: 4,
  },
  listingModel: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
  },
  listingPrice: {
    ...Typography.price,
    color: Colors.textPrimary,
    fontSize: 22,
  },
  timelineSection: {
    marginTop: 28,
  },
  detailsCard: {
    marginHorizontal: SPACING.screen,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(10,10,10,0.82)",
    padding: 16,
    gap: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },
  actionCard: {
    marginHorizontal: SPACING.screen,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 18,
    gap: 10,
  },
  actionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  actionBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  trackingInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
    backgroundColor: Colors.card,
  },
});
