import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { MarketTickerItem } from "@/constants/marketTicker";
import { useMarketTicker } from "@/hooks/useMarketTicker";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

function formatTickerPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString("en-US")}`;
  return `$${value.toFixed(0)}`;
}

function TickerChip({ item }: { item: MarketTickerItem }) {
  const isUp = item.changePercent >= 0;
  const changeColor = isUp ? Colors.success : Colors.error;

  return (
    <View style={styles.chip}>
      <Text style={styles.chipName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.chipRef}>{item.reference}</Text>
      <Text style={styles.chipPrice}>{formatTickerPrice(item.price)}</Text>
      <View style={styles.changeRow}>
        <Ionicons
          name={isUp ? "caret-up" : "caret-down"}
          size={12}
          color={changeColor}
          style={styles.changeIcon}
        />
        <Text style={[styles.chipChange, { color: changeColor }]}>
          {isUp ? "+" : ""}
          {item.changePercent.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

function TickerSegment({ items }: { items: MarketTickerItem[] }) {
  return (
    <View style={styles.segment}>
      {items.map((item) => (
        <TickerChip key={item.id} item={item} />
      ))}
    </View>
  );
}

export function MarketTickerMarquee() {
  const insets = useSafeAreaInsets();
  const { items, isLive } = useMarketTicker();
  const [segmentWidth, setSegmentWidth] = useState(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth <= 0) return;

    offset.value = 0;
    offset.value = withRepeat(
      withTiming(-segmentWidth, {
        duration: Math.max(segmentWidth * 18, 12_000),
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => cancelAnimation(offset);
  }, [offset, segmentWidth, items.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.labelRow}>
        <View style={[styles.liveDot, isLive ? styles.liveDotActive : styles.liveDotIdle]} />
        <Text style={styles.label}>{isLive ? "Live" : "Market"}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.scroller, animatedStyle]}>
          <View
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              if (width > 0) setSegmentWidth(width);
            }}
          >
            <TickerSegment items={items} />
          </View>
          <TickerSegment items={items} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: "hidden",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.cardElevated,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveDotActive: {
    backgroundColor: Colors.success,
  },
  liveDotIdle: {
    backgroundColor: Colors.textMuted,
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  track: {
    flex: 1,
    overflow: "hidden",
  },
  scroller: {
    flexDirection: "row",
    alignItems: "center",
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  chipName: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 108,
  },
  chipRef: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
  chipPrice: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeIcon: {
    marginRight: 1,
  },
  chipChange: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
