import { Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type Props = {
  flags?: string[] | null;
  fraudRiskScore?: number;
};

export function FraudWarningBanner({ flags, fraudRiskScore }: Props) {
  if (!flags?.length && (fraudRiskScore ?? 0) < 50) return null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: Colors.error,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <Text style={{ ...Typography.caption, color: Colors.error, letterSpacing: 0.5 }}>
        TRUST ALERT
      </Text>
      <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginTop: 6 }}>
        {flags?.slice(0, 3).join(" · ").replace(/_/g, " ") ||
          "Elevated fraud risk detected. Proceed with caution."}
      </Text>
    </View>
  );
}
