import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { UserProfile } from "@/types";

type Props = {
  seller: UserProfile;
  onPress?: () => void;
};

export function SellerCard({ seller, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 2,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Image
        source={{
          uri:
            seller.avatar_url ??
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
        }}
        style={{ width: 48, height: 48, borderRadius: 24 }}
        contentFit="cover"
      />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>
            @{seller.username ?? "seller"}
          </Text>
          {seller.verified && (
            <View
              style={{
                backgroundColor: Colors.border,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 2,
              }}
            >
              <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
                Verified
              </Text>
            </View>
          )}
        </View>
        {seller.bio && (
          <Text
            style={{
              ...Typography.caption,
              color: Colors.textMuted,
              marginTop: 4,
            }}
            numberOfLines={1}
          >
            {seller.bio}
          </Text>
        )}
        {seller.seller_rating != null && (
          <Text
            style={{
              ...Typography.caption,
              color: Colors.textSecondary,
              marginTop: 4,
            }}
          >
            {seller.seller_rating.toFixed(1)} rating
          </Text>
        )}
      </View>
    </Pressable>
  );
}
