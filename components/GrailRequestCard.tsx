import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { formatPrice } from "@/lib/stripe";
import type { GrailRequest } from "@/types";

type Props = {
  grail: GrailRequest;
  onCancel?: () => void;
};

function createStyles() {
  return StyleSheet.create({
    card: {
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      marginBottom: 10,
      gap: 4,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.cardElevated,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { ...Typography.body, color: Colors.textPrimary, fontWeight: "600", flex: 1 },
    ref: { ...Typography.caption, color: Colors.textSecondary, marginLeft: 46 },
    budget: { ...Typography.caption, color: Colors.textMuted, marginLeft: 46 },
    notes: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, marginLeft: 46, lineHeight: 18 },
    cancel: { marginTop: 10, marginLeft: 46 },
    cancelText: { ...Typography.caption, color: Colors.textMuted },
  });
}

export function GrailRequestCard({ grail, onCancel }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Ionicons name="search" size={16} color={Colors.textPrimary} />
        </View>
        <Text style={styles.title}>
          {[grail.brand, grail.model].filter(Boolean).join(" ") || "Any watch"}
        </Text>
      </View>
      {grail.reference_number ? (
        <Text style={styles.ref}>Ref. {grail.reference_number}</Text>
      ) : null}
      {grail.max_budget ? (
        <Text style={styles.budget}>Budget up to {formatPrice(grail.max_budget)}</Text>
      ) : null}
      {grail.notes ? <Text style={styles.notes}>{grail.notes}</Text> : null}
      {onCancel ? (
        <Pressable onPress={onCancel} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel hunt</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
