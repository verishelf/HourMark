import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { formatPrice } from "@/lib/stripe";
import { createOffer, respondToOffer, withdrawOffer } from "@/services/offers";
import type { ListingOffer } from "@/types";

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
      padding: SPACING.screen,
      paddingBottom: 40,
      gap: 12,
      borderTopWidth: 1,
      borderColor: Colors.border,
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: Colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 8,
    },
    title: { ...Typography.h3, color: Colors.textPrimary },
    subtitle: { ...Typography.caption, color: Colors.textMuted },
    label: {
      ...Typography.caption,
      color: Colors.textMuted,
      marginTop: 4,
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
    textArea: { minHeight: 72, textAlignVertical: "top" },
    offerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      marginVertical: 4,
    },
    offerBadge: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
      backgroundColor: Colors.cardElevated,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: Colors.border,
      marginVertical: 4,
    },
    offerAmount: { ...Typography.h3, color: Colors.textPrimary, fontSize: 18 },
    offerMessage: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
    offerStatus: { ...Typography.caption, color: Colors.textSecondary, textTransform: "capitalize" },
    actions: { flexDirection: "row", gap: 8 },
    acceptBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.textPrimary,
      alignItems: "center",
      justifyContent: "center",
    },
    declineBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.cardElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    withdraw: { ...Typography.caption, color: Colors.textMuted },
  });
}

type Props = {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingPrice: number;
  minOfferPrice?: number | null;
  buyerId: string;
  sellerId: string;
  onOfferCreated?: (offer: ListingOffer) => void;
};

export function MakeOfferModal({
  visible,
  onClose,
  listingId,
  listingPrice,
  minOfferPrice,
  buyerId,
  sellerId,
  onOfferCreated,
}: Props) {
  const styles = useThemedStyles(createModalStyles);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cents = Math.round(parseFloat(amount.replace(/[^0-9.]/g, "")) * 100);
    if (!cents || cents <= 0) {
      Alert.alert("Invalid amount", "Enter a valid offer amount.");
      return;
    }
    if (minOfferPrice && cents < minOfferPrice) {
      Alert.alert("Too low", `Minimum offer is ${formatPrice(minOfferPrice)}`);
      return;
    }
    if (cents >= listingPrice) {
      Alert.alert("Use Buy Now", "Your offer meets or exceeds the asking price. Use Buy Now instead.");
      return;
    }

    setLoading(true);
    try {
      const offer = await createOffer({
        listingId,
        buyerId,
        sellerId,
        amount: cents,
        message: message.trim() || undefined,
      });
      onOfferCreated?.(offer);
      Alert.alert("Offer sent", "The seller will be notified.");
      onClose();
      setAmount("");
      setMessage("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not send offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Make an Offer</Text>
          <Text style={styles.subtitle}>
            Asking price {formatPrice(listingPrice)}
            {minOfferPrice ? ` · Min ${formatPrice(minOfferPrice)}` : ""}
          </Text>

          <Text style={styles.label}>Your offer (USD)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Message (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Add a note for the seller…"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <LuxuryButton label={loading ? "Sending…" : "Send Offer"} onPress={handleSubmit} disabled={loading} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type OfferRowProps = {
  offer: ListingOffer;
  isSeller: boolean;
  onUpdate: (offer: ListingOffer) => void;
};

export function OfferActionRow({ offer, isSeller, onUpdate }: OfferRowProps) {
  const styles = useThemedStyles(createModalStyles);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "accept" | "decline") => {
    setLoading(true);
    try {
      const updated = await respondToOffer(offer.id, offer.seller_id, action);
      onUpdate(updated);
      Alert.alert(action === "accept" ? "Offer accepted" : "Offer declined");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      await withdrawOffer(offer.id, offer.buyer_id);
      onUpdate({ ...offer, status: "withdrawn" });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (offer.status !== "pending") {
    return (
      <View style={styles.offerBadge}>
        <Text style={styles.offerStatus}>{offer.status.replace("_", " ")}</Text>
        <Text style={styles.offerAmount}>{formatPrice(offer.amount)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.offerRow}>
      <View>
        <Text style={styles.offerAmount}>{formatPrice(offer.amount)}</Text>
        {offer.message ? <Text style={styles.offerMessage}>{offer.message}</Text> : null}
      </View>
      {isSeller ? (
        <View style={styles.actions}>
          <Pressable style={styles.acceptBtn} onPress={() => handleAction("accept")} disabled={loading}>
            <Ionicons name="checkmark" size={18} color={Colors.background} />
          </Pressable>
          <Pressable style={styles.declineBtn} onPress={() => handleAction("decline")} disabled={loading}>
            <Ionicons name="close" size={18} color={Colors.textPrimary} />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={handleWithdraw} disabled={loading}>
          <Text style={styles.withdraw}>Withdraw</Text>
        </Pressable>
      )}
    </View>
  );
}
