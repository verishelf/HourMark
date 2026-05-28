import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { formatPrice } from "@/lib/stripe";
import { getListingCoverImage } from "@/lib/listingImages";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { Typography } from "@/constants/typography";
import type { Listing } from "@/types";

const { width } = Dimensions.get("window");
const SLIDE_HEIGHT = 520;
const AUTO_ADVANCE_MS = 5500;

type Props = {
  listings: Listing[];
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
    <Pressable onPress={onPress} style={{ width, height: SLIDE_HEIGHT }}>
      {coverImage ? (
        <Image
          source={{ uri: coverImage }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={400}
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
            color: Colors.textSecondary,
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
            color: Colors.textPrimary,
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
            color: Colors.textSecondary,
            marginBottom: 16,
          }}
        >
          {item.model}
        </FadeInText>
        <FadeInText
          isActive={isActive}
          delay={300}
          style={{ ...Typography.price, color: Colors.textPrimary }}
        >
          {formatPrice(item.price)}
        </FadeInText>
      </View>
    </Pressable>
  );
}

export function FeaturedCarousel({ listings }: Props) {
  const router = useRouter();
  const listRef = useRef<FlatList<Listing>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (index != null) {
        activeIndexRef.current = index;
        setActiveIndex(index);
      }
    }
  ).current;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (listings.length <= 1) return;

    const timer = setInterval(() => {
      const next = (activeIndexRef.current + 1) % listings.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [listings.length, activeIndex]);

  if (!listings.length) return null;

  return (
    <View style={{ marginBottom: 48 }}>
      <FlatList
        ref={listRef}
        data={listings}
        horizontal
        pagingEnabled
        {...HIDE_SCROLL_INDICATORS}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 100);
        }}
        renderItem={({ item, index }) => (
          <FeaturedSlide
            item={item}
            isActive={index === activeIndex}
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
              width: i === activeIndex ? 24 : 6,
              opacity: i === activeIndex ? 1 : 0.3,
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
