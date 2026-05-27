import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useStripe,
  
  isPlatformPaySupported,
} from "@stripe/stripe-react-native";
import { Image } from "expo-image";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { COMMISSION_RATE } from "@/constants/colors";
import { formatPrice, calculateCommission } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";
import { getListingById } from "@/services/listings";
import { createPaymentIntent, completeOrder } from "@/services/payments";
import type { Listing } from "@/types";

export default function CheckoutScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    getListingById(listingId).then(setListing);
    isPlatformPaySupported().then(setApplePayAvailable);
  }, [listingId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleCheckout = async () => {
    if (!listing || !user) return;

    setLoading(true);
    try {
      const { clientSecret, orderId } = await createPaymentIntent({
        listingId: listing.id,
        buyerId: user.id,
        amountCents: listing.price,
      });

      if (clientSecret === "mock_client_secret") {
        Alert.alert(
          "Demo Mode",
          "Stripe is not configured. In production, payment would process here.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "HourMark",
        applePay: applePayAvailable
          ? {
              merchantCountryCode: "US",
            }
          : undefined,
        googlePay: {
          merchantCountryCode: "US",
          testEnv: true,
        },
        defaultBillingDetails: { email: user.email },
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") {
          throw new Error(presentError.message);
        }
        return;
      }

      await completeOrder(orderId);
      Alert.alert("Purchase Complete", "Your order has been confirmed.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/profile") },
      ]);
    } catch (e) {
      Alert.alert("Payment Failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  const handleApplePay = async () => {
    if (!listing || !user) return;
    setLoading(true);
    try {
      const { clientSecret } = await createPaymentIntent({
        listingId: listing.id,
        buyerId: user.id,
        amountCents: listing.price,
      });

      if (clientSecret === "mock_client_secret") {
        Alert.alert("Demo Mode", "Apple Pay requires Stripe configuration.");
        return;
      }

      await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "HourMark",
        applePay: { merchantCountryCode: "US" },
      });

      const { error } = await presentPaymentSheet();
      if (error && error.code !== "Canceled") throw new Error(error.message);
    } catch (e) {
      Alert.alert("Apple Pay Failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: Colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const commission = calculateCommission(listing.price);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: 8 }}>
        Checkout
      </Text>
      <Text style={{ ...Typography.h1, color: Colors.textPrimary, marginBottom: 32 }}>
        Secure Purchase
      </Text>

      <Image
        source={{ uri: listing.images[0] }}
        style={{ width: "100%", height: 200, marginBottom: 24 }}
        contentFit="cover"
      />

      <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>
        {listing.brand} {listing.model}
      </Text>
      <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: 4, marginBottom: 32 }}>
        Protected by HourMark buyer guarantee
      </Text>

      <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 20, marginBottom: 32 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ ...Typography.body, color: Colors.textSecondary }}>Subtotal</Text>
          <Text style={{ ...Typography.body, color: Colors.textPrimary }}>{formatPrice(listing.price)}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
            Platform fee ({(COMMISSION_RATE * 100).toFixed(0)}%)
          </Text>
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
            {formatPrice(commission)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>Total</Text>
          <Text style={{ ...Typography.price, color: Colors.textPrimary, fontSize: 22 }}>
            {formatPrice(listing.price)}
          </Text>
        </View>
      </View>

      <LuxuryButton label="Pay with Card" onPress={handleCheckout} loading={loading} />

      {applePayAvailable && (
        <>
          <View style={{ height: 12 }} />
          <LuxuryButton
            label=" Apple Pay"
            onPress={handleApplePay}
            variant="outline"
            loading={loading}
          />
        </>
      )}

      <Text
        style={{
          ...Typography.caption,
          color: Colors.textMuted,
          textAlign: "center",
          marginTop: 24,
          lineHeight: 18,
        }}
      >
        Payments are processed securely via Stripe. Sellers receive payouts through Stripe Connect after delivery confirmation.
      </Text>
    </ScrollView>
  );
}
