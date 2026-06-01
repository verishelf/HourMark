import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { LISTING_CARD_RADIUS, RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";

export type FirstListingPlaceholderVariant = "grid" | "compact" | "featured";

type Props = {
  variant?: FirstListingPlaceholderVariant;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
};

const DEFAULT_TITLE = "Be the first to sell";
const DEFAULT_SUBTITLE = "List a timepiece and start the marketplace";

export function FirstListingPlaceholderCard({
  variant = "grid",
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  onPress,
}: Props) {
  const router = useRouter();
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const isGrid = variant === "grid";

  const imageHeight = isFeatured ? 320 : isCompact || isGrid ? 160 : 200;
  const iconSize = isFeatured ? 48 : isGrid ? 32 : 36;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
      return;
    }
    router.push("/(tabs)/sell");
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        width: isCompact ? "100%" : "100%",
        opacity: pressed ? 0.92 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: LISTING_CARD_RADIUS,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: Colors.border,
          borderStyle: "dashed",
        }}
      >
        <View
          style={{
            width: "100%",
            height: imageHeight,
            backgroundColor: Colors.cardElevated,
            alignItems: "center",
            justifyContent: "center",
            gap: isFeatured ? 12 : 8,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: iconSize + 24,
              height: iconSize + 24,
              borderRadius: (iconSize + 24) / 2,
              backgroundColor: Colors.card,
              borderWidth: 1,
              borderColor: Colors.borderLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="watch-outline" size={iconSize} color={Colors.textMuted} />
          </View>
          {isFeatured ? (
            <>
              <Text
                style={{
                  ...Typography.h2,
                  color: Colors.textPrimary,
                  textAlign: "center",
                  fontSize: 22,
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  ...Typography.body,
                  color: Colors.textMuted,
                  textAlign: "center",
                  fontSize: 15,
                  lineHeight: 22,
                  maxWidth: 280,
                }}
              >
                {subtitle}
              </Text>
              <View
                style={{
                  marginTop: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: RADIUS.pill,
                  backgroundColor: Colors.textPrimary,
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.background} />
                <Text
                  style={{
                    ...Typography.caption,
                    color: Colors.background,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  List a watch
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {!isFeatured ? (
          <View style={{ padding: isGrid ? 10 : 12 }}>
            <Text
              style={{
                ...Typography.label,
                color: Colors.textMuted,
                marginBottom: 4,
                fontSize: isGrid ? 9 : 10,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Crownly
            </Text>
            <Text
              style={{
                ...Typography.h3,
                color: Colors.textPrimary,
                fontSize: isGrid ? 14 : 16,
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
            <Text
              style={{
                ...Typography.caption,
                color: Colors.textMuted,
                fontSize: isGrid ? 11 : 12,
                lineHeight: 16,
              }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
