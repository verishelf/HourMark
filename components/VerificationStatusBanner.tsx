import { StyleSheet, Text, View } from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { authenticationStatusLabel } from "@/lib/trust";
import type { AuthenticationStatus } from "@/types";

type Props = {
  status: AuthenticationStatus;
  trustScore?: number;
};

function createStyles() {
  return StyleSheet.create({
    banner: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      padding: 14,
      marginBottom: 16,
    },
    bannerRejected: {
      borderColor: Colors.error,
      backgroundColor: Colors.cardElevated,
    },
    eyebrow: {
      ...Typography.caption,
      color: Colors.textMuted,
      letterSpacing: 1,
      fontSize: 10,
    },
    status: {
      ...Typography.body,
      color: Colors.textPrimary,
      marginTop: 6,
      fontWeight: "600",
    },
    statusRejected: {
      color: Colors.error,
    },
    hint: {
      ...Typography.caption,
      color: Colors.textMuted,
      marginTop: 6,
      lineHeight: 18,
    },
  });
}

export function VerificationStatusBanner({ status, trustScore }: Props) {
  const styles = useThemedStyles(createStyles);
  const isAnalyzing = status === "analyzing" || status === "pending";
  const isRejected = status === "rejected";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[styles.banner, isRejected && styles.bannerRejected]}
    >
      <Text style={styles.eyebrow}>AUTHENTICATION</Text>
      <Text style={[styles.status, isRejected && styles.statusRejected]}>
        {authenticationStatusLabel(status)}
        {trustScore != null && status === "auto_verified" ? ` · ${trustScore}/100` : ""}
      </Text>
      {isAnalyzing ? (
        <Text style={styles.hint}>
          AI is reviewing serial, movement, and provenance media…
        </Text>
      ) : null}
    </MotiView>
  );
}
