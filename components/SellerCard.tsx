import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { RADIUS } from "@/constants/layout";
import type { UserProfile } from "@/types";

const AVATAR_SIZE = 44;
const ROW_GAP = 12;

type Props = {
  seller: UserProfile;
  onPress?: () => void;
};

export function SellerCard({ seller, onPress }: Props) {
  const textIndent = AVATAR_SIZE + ROW_GAP;
  const username = seller.username ?? "seller";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 16,
        backgroundColor: Colors.cardElevated,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: RADIUS.md,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: ROW_GAP }}>
        <Image
          source={{
            uri:
              seller.avatar_url ??
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
          }}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            borderWidth: 1,
            borderColor: Colors.borderLight,
            backgroundColor: Colors.card,
          }}
          contentFit="cover"
        />

        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minHeight: AVATAR_SIZE }}>
          <Text
            style={{
              ...Typography.body,
              color: Colors.textPrimary,
              fontSize: 16,
              fontWeight: "600",
              lineHeight: 20,
              flex: 1,
            }}
            numberOfLines={1}
          >
            @{username}
          </Text>
          {seller.verified && (
            <View
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: RADIUS.pill,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ ...Typography.caption, color: Colors.textSecondary, fontSize: 11 }}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      {seller.bio ? (
        <Text
          style={{
            ...Typography.caption,
            color: Colors.textMuted,
            marginTop: 10,
            marginLeft: textIndent,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {seller.bio}
        </Text>
      ) : null}

      {seller.seller_rating != null ? (
        <Text
          style={{
            ...Typography.caption,
            color: Colors.textSecondary,
            marginTop: seller.bio ? 6 : 10,
            marginLeft: textIndent,
            lineHeight: 18,
          }}
        >
          {seller.seller_rating.toFixed(1)} seller rating
        </Text>
      ) : null}
    </Pressable>
  );
}
