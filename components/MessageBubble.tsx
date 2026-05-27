import { Text, View } from "react-native";
import { MotiView } from "moti";
import { formatRelativeTime } from "@/lib/utils";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { Message } from "@/types";

type Props = {
  message: Message;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 250 }}
      style={{
        alignSelf: isOwn ? "flex-end" : "flex-start",
        maxWidth: "78%",
        marginBottom: 12,
      }}
    >
      <View
        style={{
          backgroundColor: isOwn ? Colors.textPrimary : Colors.card,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 2,
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
    </MotiView>
  );
}
