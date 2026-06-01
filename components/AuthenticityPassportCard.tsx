import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { AuthenticityPassport } from "@/types";

type Props = {
  passport: AuthenticityPassport;
};

function createStyles() {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      padding: 16,
      backgroundColor: Colors.card,
      gap: 12,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconTile: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.cardElevated,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    eyebrow: {
      ...Typography.caption,
      color: Colors.textMuted,
      letterSpacing: 1,
      fontSize: 10,
    },
    code: { ...Typography.h3, color: Colors.textPrimary, fontSize: 20, marginTop: 2 },
    details: { gap: 4 },
    watch: { ...Typography.body, color: Colors.textPrimary, fontWeight: "600" },
    ref: { ...Typography.caption, color: Colors.textSecondary },
    serial: { ...Typography.caption, color: Colors.textMuted },
    score: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
    date: { ...Typography.caption, color: Colors.textMuted, fontSize: 11 },
    footer: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontSize: 10,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingTop: 10,
    },
  });
}

export function AuthenticityPassportCard({ passport }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.textPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>CROWNLY AUTHENTICITY PASSPORT</Text>
          <Text style={styles.code}>{passport.passport_code}</Text>
        </View>
      </View>

      <View style={styles.details}>
        {passport.brand ? (
          <Text style={styles.watch}>
            {passport.brand} {passport.model}
          </Text>
        ) : null}
        {passport.reference_number ? (
          <Text style={styles.ref}>Ref. {passport.reference_number}</Text>
        ) : null}
        {passport.serial_number ? (
          <Text style={styles.serial}>Serial · {passport.serial_number}</Text>
        ) : null}
        {passport.trust_score != null ? (
          <Text style={styles.score}>Trust score {passport.trust_score}/100</Text>
        ) : null}
        <Text style={styles.date}>
          Verified {new Date(passport.verified_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.footer}>AI-verified listing · Escrow-protected provenance</Text>
    </View>
  );
}
