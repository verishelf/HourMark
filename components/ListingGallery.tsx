import { useRef } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  View,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useInfiniteCarousel } from "@/lib/infiniteCarousel";
import { resolveListingImageUrl } from "@/lib/listingImages";

const { width, height } = Dimensions.get("window");

type Props = {
  images: string[];
};

export function ListingGallery({ images }: Props) {
  const resolvedImages = images
    .map((image) => resolveListingImageUrl(image))
    .filter((image): image is string => Boolean(image));

  const {
    listRef,
    loopData,
    realCount,
    realIndex,
    onMomentumScrollEnd,
    onViewableLoopIndexChanged,
    getItemLayout,
  } = useInfiniteCarousel(resolvedImages, width, { initialScroll: true });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (index != null) onViewableLoopIndexChanged(index);
    }
  ).current;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={loopData}
        horizontal
        pagingEnabled
        {...HIDE_SCROLL_INDICATORS}
        decelerationRate={Platform.OS === "ios" ? "fast" : "normal"}
        overScrollMode="never"
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 80);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height: height * 0.55 }}
            contentFit="cover"
            transition={300}
          />
        )}
      />
      {realCount > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 4,
            paddingVertical: 16,
          }}
        >
          {resolvedImages.map((_, i) => (
            <MotiView
              key={i}
              animate={{
                opacity: i === realIndex ? 1 : 0.25,
              }}
              style={{
                width: i === realIndex ? 20 : 6,
                height: 2,
                backgroundColor: Colors.textPrimary,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
