import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { formatPrice } from "@/lib/stripe";
import { getOrderById } from "@/services/payments";
import type { Order } from "@/types";

export default function CheckoutSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId).then(setOrder);
  }, [orderId]);

  const listing = order?.listing;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: insets.top + 48,
        paddingHorizontal: 24,
        paddingBottom: insets.bottom + 32,
        justifyContent: "space-between",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Ionicons name="checkmark" size={40} color={Colors.success} />
        </View>

        <Text style={{ ...Typography.h1, color: Colors.textPrimary, textAlign: "center" }}>
          Purchase Complete
        </Text>
        <Text
          style={{
            ...Typography.body,
            color: Colors.textMuted,
            textAlign: "center",
            marginTop: 12,
            lineHeight: 22,
          }}
        >
          Your payment was processed securely. The seller will be notified to arrange
          authenticated delivery.
        </Text>

        {listing ? (
          <View
            style={{
              marginTop: 40,
              width: "100%",
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              paddingTop: 24,
            }}
          >
            <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
              Order confirmed
            </Text>
            <Text style={{ ...Typography.h3, color: Colors.textPrimary, marginTop: 8 }}>
              {listing.brand} {listing.model}
            </Text>
            <Text style={{ ...Typography.price, color: Colors.success, marginTop: 8 }}>
              {formatPrice(order?.amount ?? listing.price)}
            </Text>
          </View>
        ) : null}
      </View>

      <View>
        <LuxuryButton
          label="View Orders"
          onPress={() => router.replace("/(tabs)/profile")}
        />
        <View style={{ height: 12 }} />
        <LuxuryButton
          label="Continue Browsing"
          variant="outline"
          onPress={() => router.replace("/(tabs)")}
        />
      </View>
    </View>
  );
}
