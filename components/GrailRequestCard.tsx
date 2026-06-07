import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserAvatar } from "@/components/UserAvatar";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { formatRelativeTime } from "@/lib/utils";
import { formatPrice } from "@/lib/stripe";
import type { GrailRequest } from "@/types";

type Props = {
  grail: GrailRequest;
  onEdit?: () => void;
  onDelete?: () => void;
};

function statusMeta(status: GrailRequest["status"]) {
  switch (status) {
    case "fulfilled":
      return { label: "Fulfilled", color: Colors.textPrimary, icon: "checkmark-circle" as const };
    case "cancelled":
      return { label: "Cancelled", color: Colors.textMuted, icon: "close-circle" as const };
    default:
      return { label: "Active", color: Colors.success, icon: "radio-button-on" as const };
  }
}

function createStyles() {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      padding: 14,
      marginBottom: 12,
      gap: 10,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    lead: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      minWidth: 0,
    },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.cardElevated,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    title: {
      ...Typography.body,
      color: Colors.textPrimary,
      fontWeight: "600",
      fontSize: 15,
      lineHeight: 20,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    username: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontSize: 11,
    },
    metaCol: {
      alignItems: "flex-end",
      gap: 6,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: RADIUS.pill,
      backgroundColor: Colors.cardElevated,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    statusText: {
      ...Typography.caption,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    time: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontSize: 10,
      fontVariant: ["tabular-nums"],
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.cardElevated,
    },
    chipText: {
      ...Typography.caption,
      color: Colors.textSecondary,
      fontSize: 11,
    },
    notes: {
      ...Typography.caption,
      color: Colors.textSecondary,
      lineHeight: 18,
      fontSize: 12,
    },
    ownerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginTop: 4,
    },
    ownerActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    ownerActionText: {
      ...Typography.caption,
      color: Colors.textSecondary,
      fontSize: 11,
      fontWeight: "500",
    },
    ownerActionDelete: {
      color: Colors.error,
    },
  });
}

export function GrailRequestCard({ grail, onEdit, onDelete }: Props) {
  const styles = useThemedStyles(createStyles);
  const title = [grail.brand, grail.model].filter(Boolean).join(" ") || "Any watch";
  const status = statusMeta(grail.status);
  const username = grail.user?.username;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.lead}>
          <View style={styles.iconTile}>
            <Ionicons name="diamond-outline" size={18} color={Colors.textPrimary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {username ? (
              <View style={styles.userRow}>
                <UserAvatar uri={grail.user?.avatar_url} size={16} />
                <Text style={styles.username}>@{username}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.metaCol}>
          <View style={styles.statusPill}>
            <Ionicons name={status.icon} size={10} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.time}>{formatRelativeTime(grail.created_at)}</Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        {grail.reference_number ? (
          <View style={styles.chip}>
            <Ionicons name="barcode-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.chipText}>Ref. {grail.reference_number}</Text>
          </View>
        ) : null}
        {grail.max_budget ? (
          <View style={styles.chip}>
            <Ionicons name="wallet-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.chipText}>Up to {formatPrice(grail.max_budget)}</Text>
          </View>
        ) : null}
        {grail.min_condition ? (
          <View style={styles.chip}>
            <Ionicons name="sparkles-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.chipText}>{grail.min_condition}+</Text>
          </View>
        ) : null}
      </View>

      {grail.notes ? (
        <Text style={styles.notes} numberOfLines={3}>
          {grail.notes}
        </Text>
      ) : null}

      {onEdit || onDelete ? (
        <View style={styles.ownerActions}>
          {onEdit ? (
            <Pressable onPress={onEdit} style={styles.ownerActionBtn} hitSlop={8}>
              <Ionicons name="create-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.ownerActionText}>Edit</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} style={styles.ownerActionBtn} hitSlop={8}>
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text style={[styles.ownerActionText, styles.ownerActionDelete]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
