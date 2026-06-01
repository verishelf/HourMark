import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { formatPrice } from "@/lib/stripe";
import type { WatchCollectionItem } from "@/types";

type Props = {
  item: WatchCollectionItem;
  onPress?: () => void;
};

function createStyles() {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      gap: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      marginBottom: 10,
    },
    image: { width: 72, height: 72, borderRadius: RADIUS.sm },
    placeholder: {
      backgroundColor: Colors.cardElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    meta: { flex: 1, justifyContent: "center" },
    brand: { ...Typography.caption, color: Colors.textMuted },
    model: { ...Typography.body, color: Colors.textPrimary, fontWeight: "600" },
    ref: { ...Typography.caption, color: Colors.textMuted, fontSize: 11, marginTop: 2 },
    valueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    value: { ...Typography.caption, color: Colors.textPrimary, fontWeight: "600" },
    gain: { ...Typography.caption, fontSize: 11 },
    gainUp: { color: Colors.success },
    gainDown: { color: Colors.error },
    passportBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
    passportText: { ...Typography.caption, color: Colors.textMuted, fontSize: 10 },
  });
}

export function CollectionItemCard({ item, onPress }: Props) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const value = item.estimated_value ?? item.purchase_price ?? 0;
  const cost = item.purchase_price ?? 0;
  const gain = value - cost;
  const gainPct = cost > 0 ? ((gain / cost) * 100).toFixed(1) : "0";

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress ?? (() => router.push("/collection"))}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="watch-outline" size={28} color={Colors.textMuted} />
        </View>
      )}
      <View style={styles.meta}>
        <Text style={styles.brand}>{item.brand}</Text>
        <Text style={styles.model} numberOfLines={1}>
          {item.model}
        </Text>
        {item.reference_number ? (
          <Text style={styles.ref}>Ref. {item.reference_number}</Text>
        ) : null}
        <View style={styles.valueRow}>
          <Text style={styles.value}>{formatPrice(value)}</Text>
          {cost > 0 ? (
            <Text style={[styles.gain, gain >= 0 ? styles.gainUp : styles.gainDown]}>
              {gain >= 0 ? "+" : ""}
              {gainPct}%
            </Text>
          ) : null}
        </View>
        {item.passport_id ? (
          <View style={styles.passportBadge}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.textSecondary} />
            <Text style={styles.passportText}>Passport</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
