import { View } from "react-native";
import { Badge } from "@/components/Badge";
import { TRUST_BADGE_LABELS, type TrustBadgeId } from "@/types/trust";

type Props = {
  badges?: string[] | null;
  compact?: boolean;
};

export function TrustBadgeRow({ badges, compact }: Props) {
  if (!badges?.length) return null;

  const ids = badges.filter((b): b is TrustBadgeId => b in TRUST_BADGE_LABELS);

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: compact ? 6 : 8 }}>
      {ids.map((id) => (
        <Badge
          key={id}
          label={TRUST_BADGE_LABELS[id]}
          variant={id === "ai_authenticated" || id === "verified_seller" ? "success" : "default"}
        />
      ))}
    </View>
  );
}
