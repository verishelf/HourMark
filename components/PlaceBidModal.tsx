import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getMinimumBidCents } from "@/lib/auction";
import { dollarsToCents, formatPrice } from "@/lib/stripe";
import { placeBid } from "@/services/auctions";
import type { Listing } from "@/types";

type Props = {
  visible: boolean;
  onClose: () => void;
  listing: Pick<
    Listing,
    | "id"
    | "auction_current_bid"
    | "auction_starting_bid"
    | "price"
    | "brand"
    | "model"
  >;
  onBidPlaced: () => void;
};

function createModalStyles() {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: Colors.card,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      paddingHorizontal: SPACING.screen,
      paddingTop: SPACING.screen,
      borderTopWidth: 1,
      borderColor: Colors.border,
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: Colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 12,
    },
    title: { ...Typography.h3, color: Colors.textPrimary },
    subtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
    label: {
      ...Typography.caption,
      color: Colors.textMuted,
      marginTop: 16,
      marginBottom: 8,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    input: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.sm,
      padding: 14,
      color: Colors.textPrimary,
      backgroundColor: Colors.cardElevated,
      ...Typography.body,
    },
    hint: {
      ...Typography.caption,
      color: Colors.textSecondary,
      marginTop: 8,
    },
  });
}

export function PlaceBidModal({ visible, onClose, listing, onBidPlaced }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createModalStyles);
  const minBidCents = useMemo(() => getMinimumBidCents(listing), [listing]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePlaceBid = async () => {
    const parsed = parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert("Invalid bid", "Enter a valid bid amount.");
      return;
    }

    const cents = dollarsToCents(parsed);
    if (cents < minBidCents) {
      Alert.alert("Bid too low", `Minimum bid is ${formatPrice(minBidCents)}.`);
      return;
    }

    setLoading(true);
    try {
      await placeBid(listing.id, cents);
      setAmount("");
      onBidPlaced();
      onClose();
      Alert.alert("Bid placed", "You're the high bidder.");
    } catch (e) {
      Alert.alert("Bid failed", e instanceof Error ? e.message : "Could not place bid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Place a bid</Text>
          <Text style={styles.subtitle}>
            {listing.brand} {listing.model}
          </Text>

          <Text style={styles.label}>Your bid (USD)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder={(minBidCents / 100).toLocaleString()}
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
          <Text style={styles.hint}>
            Minimum bid {formatPrice(minBidCents)} · Increments of $100 after the first bid
          </Text>

          <View style={{ marginTop: 24, gap: 10 }}>
            <LuxuryButton
              label="Submit bid"
              size="large"
              onPress={handlePlaceBid}
              loading={loading}
            />
            <LuxuryButton label="Cancel" variant="ghost" size="large" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
