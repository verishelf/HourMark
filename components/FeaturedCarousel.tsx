import { useEffect, useRef, type ReactNode } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { ListingImage } from "@/components/ListingImage";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { formatPrice } from "@/lib/stripe";
import { getListingCoverImage } from "@/lib/listingImages";
import { Colors, OverlayTextColors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { FEATURED_CAROUSEL_HEIGHT } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { FirstListingPlaceholderCard } from "@/components/FirstListingPlaceholderCard";
import { useInfiniteCarousel } from "@/lib/infiniteCarousel";
import { useTheme } from "@/hooks/useTheme";
import type { Listing } from "@/types";

const { width } = Dimensions.get("window");
const SLIDE_HEIGHT = FEATURED_CAROUSEL_HEIGHT;
const AUTO_ADVANCE_MS = 5500;
const SLIDER_TOP_RADIUS = 20;

type Props = {
  listings: Listing[];
  showEmptyPlaceholder?: boolean;
};

function FadeInText({
  isActive,
  delay,
  children,
  style,
}: {
  isActive: boolean;
  delay: number;
  children: ReactNode;
  style?: object;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{
        opacity: isActive ? 1 : 0,
        translateY: isActive ? 0 : 14,
      }}
      transition={{
        type: "timing",
        duration: isActive ? 500 : 250,
        delay: isActive ? delay : 0,
      }}
    >
      <Text style={style}>{children}</Text>
    </MotiView>
  );
}

function FeaturedSlide({
  item,
  isActive,
  onPress,
}: {
  item: Listing;
  isActive: boolean;
  onPress: () => void;
}) {
  const coverImage = getListingCoverImage(item.images);

  return (
    <Pressable
      onPress={onPress}
      style={{
        width,
        height: SLIDE_HEIGHT,
        overflow: "hidden",
        borderTopLeftRadius: SLIDER_TOP_RADIUS,
        borderTopRightRadius: SLIDER_TOP_RADIUS,
      }}
    >
      {coverImage ? (
        <ListingImage
          uri={coverImage}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          recyclingKey={`${item.id}-${coverImage}`}
        />
      ) : (
        <View style={{ width: "100%", height: "100%", backgroundColor: Colors.cardElevated }} />
      )}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          paddingBottom: 40,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      >
        <FadeInText
          isActive={isActive}
          delay={0}
          style={{
            ...Typography.label,
            color: OverlayTextColors.muted,
            marginBottom: 8,
          }}
        >
          Featured
        </FadeInText>
        <FadeInText
          isActive={isActive}
          delay={100}
          style={{
            ...Typography.hero,
            color: OverlayTextColors.primary,
            fontSize: 36,
          }}
        >
          {item.brand}
        </FadeInText>
        <FadeInText
          isActive={isActive}
          delay={200}
          style={{
            ...Typography.h2,
            color: OverlayTextColors.secondary,
            marginBottom: 16,
          }}
        >
          {item.model}
        </FadeInText>
        <FadeInText
          isActive={isActive}
          delay={300}
          style={{ ...Typography.price, color: OverlayTextColors.primary }}
        >
          {formatPrice(item.price)}
        </FadeInText>
      </View>
    </Pressable>
  );
}

export function FeaturedCarousel({
  listings,
  showEmptyPlaceholder = false,
}: Props) {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const {
    listRef,
    loopData,
    realCount,
    realIndex,
    onMomentumScrollEnd,
    onViewableLoopIndexChanged,
    advance,
    getItemLayout,
  } = useInfiniteCarousel(listings, width, { initialScroll: true });

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

  if (!listings.length) {
    if (!showEmptyPlaceholder) return null;
    return (
      <View
        style={{
          marginBottom: 48,
          paddingHorizontal: 0,
          overflow: "hidden",
          borderTopLeftRadius: SLIDER_TOP_RADIUS,
          borderTopRightRadius: SLIDER_TOP_RADIUS,
        }}
      >
        <FirstListingPlaceholderCard variant="featured" />
      </View>
    );
  }

  const activeListingId = listings[realIndex]?.id;

  return (
    <View
      style={{
        marginBottom: 48,
        overflow: "hidden",
        borderTopLeftRadius: SLIDER_TOP_RADIUS,
        borderTopRightRadius: SLIDER_TOP_RADIUS,
      }}
    >
      <FlatList
        ref={listRef}
        data={loopData}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        removeClippedSubviews={false}
        {...HIDE_SCROLL_INDICATORS}
        decelerationRate={Platform.OS === "ios" ? "fast" : "normal"}
        overScrollMode="never"
        scrollEventThrottle={16}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        extraData={`${listings.map((l) => l.id).join(",")}-${colorScheme}`}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 100);
        }}
        renderItem={({ item }) => (
          <FeaturedSlide
            item={item}
            isActive={item.id === activeListingId}
            onPress={() => router.push(`/listing/${item.id}`)}
          />
        )}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
          marginTop: 16,
        }}
      >
        {listings.map((_, i) => (
          <MotiView
            key={i}
            animate={{
              width: i === realIndex ? 24 : 6,
              opacity: i === realIndex ? 1 : 0.3,
            }}
            transition={{ type: "timing", duration: 300 }}
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
