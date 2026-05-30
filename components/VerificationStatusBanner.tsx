import { Text, View } from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { authenticationStatusLabel } from "@/lib/trust";
import type { AuthenticationStatus } from "@/types";

type Props = {
  status: AuthenticationStatus;
  trustScore?: number;
};

export function VerificationStatusBanner({ status, trustScore }: Props) {
  const isAnalyzing = status === "analyzing" || status === "pending";
  const isRejected = status === "rejected";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={{
        borderWidth: 1,
        borderColor: isRejected ? Colors.error : Colors.borderLight,
        padding: 14,
        marginBottom: 16,
      }}
    >
      <Text style={{ ...Typography.caption, color: Colors.textMuted, letterSpacing: 1 }}>
        AUTHENTICATION
      </Text>
      <Text
        style={{
          ...Typography.body,
          color: isRejected ? Colors.error : Colors.textPrimary,
          marginTop: 6,
        }}
      >
        {authenticationStatusLabel(status)}
        {trustScore != null && status === "auto_verified" ? ` · ${trustScore}/100` : ""}
      </Text>
      {isAnalyzing && (
        <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: 6 }}>
          AI is reviewing serial, movement, and provenance media…
        </Text>
      )}
    </MotiView>
  );
}
