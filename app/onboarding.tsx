import { useRef } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
  ViewToken,
} from "react-native";
import { resetToApp } from "@/lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { CrownlyLogo } from "@/components/CrownlyLogo";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { Typography } from "@/constants/typography";
import { useInfiniteCarousel } from "@/lib/infiniteCarousel";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Curated\nTimepieces",
    subtitle: "Discover exceptional watches from verified collectors worldwide.",
  },
  {
    title: "Buy & Sell\nwith Confidence",
    subtitle: "Authenticated listings, secure payments, and trusted sellers.",
  },
  {
    title: "Your Private\nSalon",
    subtitle: "Message sellers, track orders, and build your collection.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const {
    listRef,
    loopData,
    realCount,
    realIndex,
    onMomentumScrollEnd,
    onViewableLoopIndexChanged,
    advance,
    getItemLayout,
  } = useInfiniteCarousel(SLIDES, width, { initialScroll: true });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (index != null) onViewableLoopIndexChanged(index);
    }
  ).current;

  const onLastSlide = realIndex === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          position: "absolute",
          top: insets.top + 16,
          left: 0,
          right: 0,
          zIndex: 2,
          alignItems: "center",
        }}
        pointerEvents="none"
      >
        <CrownlyLogo width={100} />
      </View>
      <FlatList
        ref={listRef}
        data={loopData}
        horizontal
        pagingEnabled
        {...HIDE_SCROLL_INDICATORS}
        decelerationRate={Platform.OS === "ios" ? "fast" : "normal"}
        overScrollMode="never"
        keyExtractor={(_, i) => String(i)}
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
          <View
            style={{
              width,
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 32,
              paddingTop: insets.top + 60,
            }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 600 }}
            >
              <Text
                style={{
                  ...Typography.hero,
                  color: Colors.textPrimary,
                  marginBottom: 24,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  ...Typography.body,
                  color: Colors.textSecondary,
                  lineHeight: 26,
                }}
              >
                {item.subtitle}
              </Text>
            </MotiView>
          </View>
        )}
      />

      <View
        style={{
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            marginBottom: 32,
          }}
        >
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === realIndex ? 24 : 6,
                height: 2,
                backgroundColor: Colors.textPrimary,
                opacity: i === realIndex ? 1 : 0.25,
              }}
            />
          ))}
        </View>

        {realCount > 1 && !onLastSlide ? (
          <LuxuryButton label="Continue" onPress={advance} />
        ) : (
          <LuxuryButton
            label="Enter Crownly"
            onPress={() => resetToApp()}
          />
        )}

        <Pressable
          onPress={() => resetToApp()}
          style={{ marginTop: 20, alignItems: "center" }}
        >
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
            Skip
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
