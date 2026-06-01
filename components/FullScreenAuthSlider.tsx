import { useEffect, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CrownlyLogo } from "@/components/CrownlyLogo";
import { AUTH_SLIDE_IMAGES } from "@/constants/authSlides";
import { Colors, OverlayTextColors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useInfiniteCarousel } from "@/lib/infiniteCarousel";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AUTO_ADVANCE_MS = 5000;

const SLIDE_COPY = [
  { title: "Curated Timepieces", subtitle: "Authenticated luxury from verified sellers" },
  { title: "Trade with Confidence", subtitle: "Escrow, AI verification, and trust badges" },
  { title: "Your Collection", subtitle: "Buy, sell, and connect with collectors worldwide" },
];

type Props = {
  images?: readonly string[];
};

function AnimatedSlideCopy({
  index,
  styles,
}: {
  index: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const copy = SLIDE_COPY[index] ?? SLIDE_COPY[0];

  return (
    <MotiView
      key={`slide-copy-${index}`}
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 320 }}
      style={styles.copy}
      pointerEvents="none"
    >
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 520, delay: 80 }}
      >
        <Text style={styles.slideTitle}>{copy.title}</Text>
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 520, delay: 200 }}
      >
        <Text style={styles.slideSubtitle}>{copy.subtitle}</Text>
      </MotiView>
    </MotiView>
  );
}

export function FullScreenAuthSlider({ images = AUTH_SLIDE_IMAGES }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const {
    listRef,
    loopData,
    realCount,
    realIndex,
    onMomentumScrollEnd,
    onViewableLoopIndexChanged,
    advance,
    getItemLayout,
  } = useInfiniteCarousel(images, SCREEN_WIDTH, { initialScroll: true });

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
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={loopData}
        horizontal
        pagingEnabled
        bounces={false}
        {...HIDE_SCROLL_INDICATORS}
        decelerationRate={Platform.OS === "ios" ? "fast" : "normal"}
        keyExtractor={(_, i) => `auth-slide-${i}`}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 80);
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
            <Image source={{ uri: item }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.overlay} />
          </View>
        )}
      />
      <View
        style={[styles.brandHeader, { paddingTop: insets.top + 20 }]}
        pointerEvents="none"
      >
        <CrownlyLogo width={120} />
      </View>
      <AnimatedSlideCopy index={realIndex} styles={styles} />
      <View style={styles.dots} pointerEvents="none">
        {images.map((_, i) => (
          <MotiView
            key={i}
            animate={{
              width: i === realIndex ? 22 : 6,
              opacity: i === realIndex ? 1 : 0.4,
            }}
            transition={{ type: "timing", duration: 280 }}
            style={styles.dot}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    brandHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3,
      alignItems: "center",
    },
    copy: {
      position: "absolute",
      left: 24,
      right: 24,
      bottom: 160,
      zIndex: 2,
    },
    slideTitle: {
      color: OverlayTextColors.primary,
      fontSize: 34,
      fontWeight: "300",
      letterSpacing: -0.5,
      marginBottom: 10,
    },
    slideSubtitle: {
      color: OverlayTextColors.secondary,
      fontSize: 16,
      lineHeight: 24,
      maxWidth: 300,
    },
    dots: {
      position: "absolute",
      bottom: 128,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    dot: {
      height: 2,
      backgroundColor: OverlayTextColors.primary,
      borderRadius: 1,
    },
  });
