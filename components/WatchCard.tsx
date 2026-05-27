import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { formatPrice } from "@/lib/stripe";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { Listing } from "@/types";

type Props = {
  listing: Listing;
  variant?: "default" | "editorial" | "compact";
  index?: number;
};

export function WatchCard({
  listing,
  variant = "default",
  index = 0,
}: Props) {
  const router = useRouter();
  const imageHeight = variant === "editorial" ? 420 : variant === "compact" ? 160 : 280;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay: index * 80 }}
    >
      <Pressable
        onPress={() => router.push(`/listing/${listing.id}`)}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      >
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: variant === "editorial" ? 0 : 2,
            overflow: "hidden",
            marginBottom: variant === "compact" ? 12 : 24,
          }}
        >
          <Image
            source={{ uri: listing.images[0] }}
            style={{ width: "100%", height: imageHeight }}
            contentFit="cover"
            transition={300}
          />
          <View style={{ padding: variant === "compact" ? 12 : 16 }}>
            <Text
              style={{
                ...Typography.label,
                color: Colors.textSecondary,
                marginBottom: 6,
              }}
            >
              {listing.brand}
            </Text>
            <Text
              style={{
                ...Typography.h3,
                color: Colors.textPrimary,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {listing.model}
            </Text>
            {listing.reference_number && variant !== "compact" && (
              <Text
                style={{
                  ...Typography.caption,
                  color: Colors.textMuted,
                  marginBottom: 12,
                }}
              >
                Ref. {listing.reference_number}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ ...Typography.price, color: Colors.textPrimary }}>
                {formatPrice(listing.price)}
              </Text>
              {listing.authenticated && (
                <Text
                  style={{
                    ...Typography.caption,
                    color: Colors.textSecondary,
                  }}
                >
                  Authenticated
                </Text>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}
