import { View, ViewStyle } from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";

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

export function WatchCardSkeleton() {
  return (
    <View style={{ marginBottom: 24 }}>
      <SkeletonLoader height={280} />
      <View style={{ padding: 16, gap: 8 }}>
        <SkeletonLoader width="30%" height={12} />
        <SkeletonLoader width="70%" height={20} />
        <SkeletonLoader width="40%" height={28} />
      </View>
    </View>
  );
}
