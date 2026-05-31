import { useEffect, useRef } from "react";
import { Dimensions, FlatList, View, type ViewToken } from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { AUTH_SLIDE_IMAGES } from "@/constants/authSlides";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { HIDE_SCROLL_INDICATORS, smoothHorizontalScrollProps } from "@/constants/scroll";
import { useInfiniteCarousel } from "@/lib/infiniteCarousel";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = SCREEN_WIDTH - 40;
const SNAP_INTERVAL = SLIDE_WIDTH + 12;
const AUTO_ADVANCE_MS = 4500;

type Props = {
  images?: readonly string[];
  height?: number;
};

export function AuthImageSlider({
  images = AUTH_SLIDE_IMAGES,
  height = 240,
}: Props) {
  const {
    listRef,
    loopData,
    realCount,
    realIndex,
    onMomentumScrollEnd,
    onViewableLoopIndexChanged,
    advance,
    getItemLayout,
  } = useInfiniteCarousel(images, SNAP_INTERVAL, { initialScroll: true });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (index != null) onViewableLoopIndexChanged(index);
    }
  ).current;

  useEffect(() => {
    if (realCount <= 1) return;
    const timer = setInterval(advance, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [realCount, advance]);

  return (
    <View style={{ marginBottom: 20 }}>
      <FlatList
        ref={listRef}
        data={loopData}
        horizontal
        {...HIDE_SCROLL_INDICATORS}
        {...smoothHorizontalScrollProps(SNAP_INTERVAL)}
        keyExtractor={(_, i) => `auth-thumb-${i}`}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 80);
        }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{
              width: SLIDE_WIDTH,
              height,
              marginRight: 12,
              borderRadius: RADIUS.md,
              backgroundColor: Colors.cardElevated,
            }}
            contentFit="cover"
            transition={300}
          />
        )}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
          marginTop: 14,
        }}
      >
        {images.map((_, i) => (
          <MotiView
            key={i}
            animate={{
              width: i === realIndex ? 20 : 6,
              opacity: i === realIndex ? 1 : 0.35,
            }}
            transition={{ type: "timing", duration: 280 }}
            style={{
              height: 2,
              backgroundColor: Colors.textPrimary,
              borderRadius: 1,
            }}
          />
        ))}
      </View>
    </View>
  );
}
