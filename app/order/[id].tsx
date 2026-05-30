import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EscrowProgressTracker } from "@/components/EscrowProgressTracker";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { confirmDelivery, releaseEscrow, updateOrderTracking } from "@/services/escrow";
import { getOrderById } from "@/services/payments";
import type { Order } from "@/types";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    if (id) getOrderById(id).then(setOrder);
  }, [id]);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center" }}>
        <Text style={{ color: Colors.textMuted, textAlign: "center" }}>Loading…</Text>
      </View>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;

  const handleShip = async () => {
    try {
      const status = await updateOrderTracking(order.id, tracking);
      setOrder({ ...order, status, tracking_number: tracking });
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
      if (refreshed) setOrder(refreshed);
      Alert.alert("Complete", "Funds released to seller.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: SPACING.screen }}>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <Text style={{ ...Typography.h2, color: Colors.textPrimary, marginTop: 12 }}>
          Order & Escrow
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.screen, paddingBottom: insets.bottom + 40 }}>
        <EscrowProgressTracker
          status={order.status}
          inspectionEndsAt={order.inspection_ends_at}
        />

        {isSeller && ["payment_held", "paid"].includes(order.status) && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ ...Typography.caption, color: Colors.textMuted }}>TRACKING</Text>
            <TextInput
              value={tracking}
              onChangeText={setTracking}
              placeholder="Carrier tracking number"
              placeholderTextColor={Colors.textMuted}
              style={{
                borderBottomWidth: 1,
                borderColor: Colors.border,
                color: Colors.textPrimary,
                marginTop: 8,
                paddingVertical: 8,
              }}
            />
            <View style={{ marginTop: 16 }}>
              <LuxuryButton label="Mark shipped" onPress={handleShip} />
            </View>
          </View>
        )}

        {isBuyer && order.status === "shipped" && (
          <View style={{ marginTop: 24 }}>
            <LuxuryButton label="Confirm delivery" onPress={handleConfirmDelivery} />
          </View>
        )}

        {isBuyer && order.status === "inspection_period" && (
          <View style={{ marginTop: 24 }}>
            <LuxuryButton label="Release funds to seller" onPress={handleRelease} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
