import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
    }
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
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
                width: i === index ? 24 : 6,
                height: 2,
                backgroundColor: Colors.textPrimary,
                opacity: i === index ? 1 : 0.25,
              }}
            />
          ))}
        </View>

        {index < SLIDES.length - 1 ? (
          <LuxuryButton
            label="Continue"
            onPress={() =>
              listRef.current?.scrollToIndex({ index: index + 1, animated: true })
            }
          />
        ) : (
          <LuxuryButton
            label="Enter HourMark"
            onPress={() => router.replace("/(tabs)")}
          />
        )}

        <Pressable
          onPress={() => router.replace("/(tabs)")}
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
