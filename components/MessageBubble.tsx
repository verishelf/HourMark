import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { formatRelativeTime } from "@/lib/utils";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { Message } from "@/types";

type Props = {
  message: Message;
  isOwn: boolean;
  avatarUri?: string;
  onAvatarPress?: () => void;
};

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200";

export function MessageBubble({ message, isOwn, avatarUri, onAvatarPress }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignSelf: isOwn ? "flex-end" : "flex-start",
        alignItems: "flex-end",
        maxWidth: "92%",
        gap: 8,
      }}
    >
      {!isOwn && (
        <Pressable onPress={onAvatarPress} hitSlop={8}>
          <Image
            source={{ uri: avatarUri ?? DEFAULT_AVATAR }}
            style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}
            contentFit="cover"
          />
        </Pressable>
      )}
      <View
        style={{
          maxWidth: "82%",
        }}
      >
        <View
          style={{
          backgroundColor: isOwn ? Colors.textPrimary : Colors.card,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 18,
          borderWidth: isOwn ? 0 : 1,
          borderColor: Colors.border,
        }}
        >
          <Text
            style={{
              ...Typography.body,
              color: isOwn ? Colors.background : Colors.textPrimary,
              fontSize: 15,
            }}
          >
            {message.text}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            alignSelf: isOwn ? "flex-end" : "flex-start",
          }}
        >
          <Text style={{ ...Typography.caption, color: Colors.textMuted, fontSize: 11 }}>
            {formatRelativeTime(message.created_at)}
          </Text>
          {isOwn && message.read_at && (
            <Text style={{ ...Typography.caption, color: Colors.textMuted, fontSize: 11 }}>
              Read
            </Text>
          )}
        </View>
      </View>
      {isOwn && (
        <Pressable onPress={onAvatarPress} hitSlop={8}>
          <Image
            source={{ uri: avatarUri ?? DEFAULT_AVATAR }}
            style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}
            contentFit="cover"
          />
        </Pressable>
      )}
    </View>
  );
}
