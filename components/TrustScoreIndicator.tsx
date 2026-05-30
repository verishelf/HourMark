import { Text, View } from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { trustScoreLabel } from "@/lib/trust";

type Props = {
  score: number;
  showLabel?: boolean;
};

export function TrustScoreIndicator({ score, showLabel = true }: Props) {
  const clamped = Math.min(100, Math.max(0, score));
  const label = trustScoreLabel(clamped);

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>{clamped}</Text>
        <Text style={{ ...Typography.caption, color: Colors.textMuted }}>Trust Score</Text>
        {showLabel && (
          <Text style={{ ...Typography.caption, color: Colors.success, marginLeft: "auto" }}>
            {label}
          </Text>
        )}
      </View>
      <View
        style={{
          marginTop: 8,
          height: 4,
          backgroundColor: Colors.border,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <MotiView
          from={{ width: "0%" }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "timing", duration: 900 }}
          style={{ height: "100%", backgroundColor: Colors.textPrimary }}
        />
      </View>
    </View>
  );
}
