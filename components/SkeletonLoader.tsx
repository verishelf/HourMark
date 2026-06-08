import { View, ViewStyle } from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";
import {
  FEATURED_CAROUSEL_HEIGHT,
  LISTING_CARD_RADIUS,
} from "@/constants/layout";
import { GRID_GAP } from "@/styles/layout";

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

const FEATURED_SLIDER_TOP_RADIUS = 20;

export function WatchCardSkeleton({
  variant = "default",
}: {
  variant?: "default" | "grid" | "compact" | "featured";
}) {
  if (variant === "featured") {
    return (
      <View
        style={{
          width: "100%",
          marginBottom: 48,
          borderTopLeftRadius: FEATURED_SLIDER_TOP_RADIUS,
          borderTopRightRadius: FEATURED_SLIDER_TOP_RADIUS,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.card,
        }}
      >
        <SkeletonLoader height={FEATURED_CAROUSEL_HEIGHT} borderRadius={0} />
      </View>
    );
  }

  const imageHeight =
    variant === "grid" || variant === "compact" ? 160 : 280;
  const padding = variant === "grid" ? 10 : variant === "compact" ? 12 : 16;
  const marginBottom = variant === "grid" || variant === "compact" ? 0 : 24;
  const priceHeight = variant === "grid" ? 16 : variant === "compact" ? 20 : 28;

  return (
    <View
      style={{
        width: "100%",
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
        {variant === "grid" || variant === "compact" ? (
          <View style={{ flexDirection: "row", gap: 4 }}>
            <SkeletonLoader width={48} height={18} borderRadius={4} />
            <SkeletonLoader width={56} height={18} borderRadius={4} />
          </View>
        ) : null}
        <SkeletonLoader width="40%" height={priceHeight} borderRadius={4} />
      </View>
    </View>
  );
}

export function ListingGridSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <View style={{ gap: GRID_GAP }}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: "row", gap: GRID_GAP }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <WatchCardSkeleton variant="grid" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <WatchCardSkeleton variant="grid" />
          </View>
        </View>
      ))}
    </View>
  );
}
