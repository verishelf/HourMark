import { StyleSheet, Text, View } from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { trustScoreLabel } from "@/lib/trust";

type Props = {
  score: number;
  showLabel?: boolean;
};

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
    },
    score: {
      ...Typography.h3,
      color: Colors.textPrimary,
    },
    label: {
      ...Typography.caption,
      color: Colors.textMuted,
    },
    badge: {
      ...Typography.caption,
      color: Colors.success,
      marginLeft: "auto",
    },
    track: {
      marginTop: 8,
      height: 4,
      backgroundColor: Colors.border,
      borderRadius: 2,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      backgroundColor: Colors.textPrimary,
    },
  });
}

export function TrustScoreIndicator({ score, showLabel = true }: Props) {
  const styles = useThemedStyles(createStyles);
  const clamped = Math.min(100, Math.max(0, score));
  const label = trustScoreLabel(clamped);

  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.score}>{clamped}</Text>
        <Text style={styles.label}>Trust Score</Text>
        {showLabel ? <Text style={styles.badge}>{label}</Text> : null}
      </View>
      <View style={styles.track}>
        <MotiView
          from={{ width: "0%" }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "timing", duration: 900 }}
          style={styles.fill}
        />
      </View>
    </View>
  );
}
