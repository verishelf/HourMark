import { View } from "react-native";
import { MarketTickerMarquee } from "@/components/MarketTickerMarquee";
import { Colors } from "@/constants/colors";

type Props = {
  onLayoutHeight?: (height: number) => void;
};

export function HomeFixedHeader({ onLayoutHeight }: Props) {
  return (
    <View
      style={{ backgroundColor: Colors.background }}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) onLayoutHeight?.(height);
      }}
    >
      <MarketTickerMarquee />
    </View>
  );
}
