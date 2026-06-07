import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { ListingImage } from "@/components/ListingImage";
import type { RecentSaleItem } from "@/constants/recentSales";
import { useRecentSales } from "@/hooks/useRecentSales";
import { resolveListingImageUrl } from "@/lib/listingImages";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

function formatSalePrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString("en-US")}`;
  return `$${value.toFixed(0)}`;
}

function SaleChip({ item, onPress }: { item: RecentSaleItem; onPress: () => void }) {
  const imageUri = item.imageUrl ? resolveListingImageUrl(item.imageUrl) : null;

  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <View style={styles.avatarWrap}>
        {imageUri ? (
          <ListingImage uri={imageUri} style={styles.avatar} recyclingKey={item.listingId} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="watch-outline" size={14} color={Colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.chipTextWrap}>
        <Text style={styles.chipName} numberOfLines={1}>
          {item.brand} {item.model}
        </Text>
        <Text style={styles.chipPrice}>{formatSalePrice(item.price)}</Text>
      </View>
    </Pressable>
  );
}

function SalesSegment({
  items,
  onPressItem,
}: {
  items: RecentSaleItem[];
  onPressItem: (item: RecentSaleItem) => void;
}) {
  return (
    <View style={styles.segment}>
      {items.map((item) => (
        <SaleChip key={item.id} item={item} onPress={() => onPressItem(item)} />
      ))}
    </View>
  );
}

export function MarketTickerMarquee() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, loading } = useRecentSales();
  const [segmentWidth, setSegmentWidth] = useState(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth <= 0 || items.length === 0) return;

    offset.value = 0;
    offset.value = withRepeat(
      withTiming(-segmentWidth, {
        duration: Math.max(segmentWidth * 16, 14_000),
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

  function openListing(item: RecentSaleItem) {
    router.push(`/listing/${item.listingId}`);
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.labelRow}>
        <View style={styles.liveDot} />
        <Text style={styles.label}>Sold</Text>
      </View>
      <View style={styles.track}>
        {!loading && items.length === 0 ? (
          <Text style={styles.emptyText}>No recent sales yet</Text>
        ) : (
          <Animated.View style={[styles.scroller, animatedStyle]}>
            <View
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                if (width > 0) setSegmentWidth(width);
              }}
            >
              <SalesSegment items={items} onPressItem={openListing} />
            </View>
            {items.length > 1 ? <SalesSegment items={items} onPressItem={openListing} /> : null}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const AVATAR_SIZE = 28;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: "hidden",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.cardElevated,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
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
    justifyContent: "center",
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 16,
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
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  avatarWrap: {
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipTextWrap: {
    maxWidth: 140,
  },
  chipName: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
  chipPrice: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
});
