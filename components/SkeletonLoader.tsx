import { View, ViewStyle } from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";
import { LISTING_CARD_RADIUS } from "@/constants/layout";

type Props = {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
};

export function SkeletonLoader({
  width = "100%",
  height = 200,
  style,
  borderRadius = 2,
}: Props) {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 0.7 }}
      transition={{
        type: "timing",
        duration: 900,
        loop: true,
      }}
      style={[
        {
          width,
          height,
          backgroundColor: Colors.card,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

export function WatchCardSkeleton({
  variant = "default",
}: {
  variant?: "default" | "grid" | "compact";
}) {
  const imageHeight = variant === "grid" || variant === "compact" ? 160 : 280;
  const padding = variant === "grid" ? 10 : variant === "compact" ? 12 : 16;
  const marginBottom = variant === "grid" || variant === "compact" ? 0 : 24;
  const priceHeight = variant === "grid" ? 16 : variant === "compact" ? 20 : 28;

  return (
    <View
      style={{
        marginBottom,
        borderRadius: LISTING_CARD_RADIUS,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.card,
      }}
    >
      <SkeletonLoader height={imageHeight} borderRadius={0} />
      <View style={{ padding, gap: 8 }}>
        <SkeletonLoader width="30%" height={12} borderRadius={4} />
        <SkeletonLoader width="70%" height={20} borderRadius={4} />
        <SkeletonLoader width="40%" height={priceHeight} borderRadius={4} />
      </View>
    </View>
  );
}
