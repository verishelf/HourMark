import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  View,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { Colors } from "@/constants/colors";
import { resolveListingImageUrl } from "@/lib/listingImages";

const { width, height } = Dimensions.get("window");

type Props = {
  images: string[];
};

export function ListingGallery({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const resolvedImages = images
    .map((image) => resolveListingImageUrl(image))
    .filter((image): image is string => Boolean(image));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  return (
    <View>
      <FlatList
        data={resolvedImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height: height * 0.55 }}
            contentFit="cover"
            transition={300}
          />
        )}
      />
      {resolvedImages.length > 1 && (
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
                opacity: i === activeIndex ? 1 : 0.25,
              }}
              style={{
                width: i === activeIndex ? 20 : 6,
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
