import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, type ColorScheme } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";

const TRUST_POINTS = [
  {
    icon: "lock-closed-outline" as const,
    text: "Bank-grade identity checks powered by Stripe Connect",
  },
  {
    icon: "eye-off-outline" as const,
    text: "Your SSN and address stay encrypted — never shown to buyers",
  },
  {
    icon: "ribbon-outline" as const,
    text: "Verified seller badge on your profile and every listing",
  },
  {
    icon: "wallet-outline" as const,
    text: "Secure payouts deposited directly to your bank account",
  },
] as const;

function createStyles(colorScheme: ColorScheme) {
  const isLight = colorScheme === "light";

  return StyleSheet.create({
    panel: {
      width: "100%",
      gap: 10,
      paddingTop: 4,
      ...(isLight
        ? {}
        : {
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
            borderRadius: RADIUS.md,
            backgroundColor: "rgba(255,255,255,0.12)",
            padding: 14,
            paddingTop: 14,
          }),
    },
    heading: {
      ...Typography.label,
      color: isLight ? Colors.textPrimary : "#FFFFFF",
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 2,
      textAlign: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
      backgroundColor: isLight ? undefined : "rgba(255,255,255,0.12)",
    },
    point: {
      ...Typography.caption,
      color: isLight ? Colors.textSecondary : "#FFFFFF",
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
    note: {
      ...Typography.caption,
      color: isLight ? Colors.textMuted : "#FFFFFF",
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
      textAlign: "center",
    },
  });
}

export function SellerVerificationTrustPanel() {
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(() => createStyles(colorScheme));
  const iconColor = colorScheme === "light" ? Colors.textPrimary : "#FFFFFF";

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Why Crownly verifies sellers</Text>
      {TRUST_POINTS.map((point) => (
        <View key={point.text} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name={point.icon} size={15} color={iconColor} />
          </View>
          <Text style={styles.point}>{point.text}</Text>
        </View>
      ))}
      <Text style={styles.note}>
        One-time setup · Usually takes a few minutes · Required before your first listing
      </Text>
    </View>
  );
}
