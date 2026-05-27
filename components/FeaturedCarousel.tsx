import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { formatPrice } from "@/lib/stripe";
import { getListingCoverImage } from "@/lib/listingImages";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { Listing } from "@/types";

const { width } = Dimensions.get("window");

type Props = {
  listings: Listing[];
};

export function FeaturedCarousel({ listings }: Props) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  if (!listings.length) return null;

  return (
    <View style={{ marginBottom: 48 }}>
      <FlatList
        data={listings}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => {
          const coverImage = getListingCoverImage(item.images);
          return (
          <Pressable
            onPress={() => router.push(`/listing/${item.id}`)}
            style={{ width, height: 520 }}
          >
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
              <Text
                style={{
                  ...Typography.label,
                  color: Colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Featured
              </Text>
              <Text
                style={{
                  ...Typography.hero,
                  color: Colors.textPrimary,
                  fontSize: 36,
                }}
              >
                {item.brand}
              </Text>
              <Text
                style={{
                  ...Typography.h2,
                  color: Colors.textSecondary,
                  marginBottom: 16,
                }}
              >
                {item.model}
              </Text>
              <Text style={{ ...Typography.price, color: Colors.textPrimary }}>
                {formatPrice(item.price)}
              </Text>
            </View>
          </Pressable>
          );
        }}
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
