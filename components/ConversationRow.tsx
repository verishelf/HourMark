import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import {
  CONVERSATION_DEFAULT_AVATAR,
  getConversationAvatarUri,
  getConversationPrimaryTitle,
  getConversationSubtitle,
  isWatchConversation,
} from "@/lib/conversationDisplay";
import { formatRelativeTime } from "@/lib/utils";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import type { Conversation } from "@/types";

const AVATAR_SIZE = 52;

type Props = {
  conversation: Conversation;
  unread: boolean;
  onPress: () => void;
};

export function ConversationRow({ conversation, unread, onPress }: Props) {
  const aboutWatch = isWatchConversation(conversation);
  const avatarUri = getConversationAvatarUri(conversation);
  const primaryTitle = getConversationPrimaryTitle(conversation);
  const subtitle = getConversationSubtitle(conversation);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: SPACING.screen,
        gap: 14,
        backgroundColor: pressed ? Colors.card : Colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
      })}
    >
      <Image
        source={{ uri: avatarUri || CONVERSATION_DEFAULT_AVATAR }}
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: aboutWatch ? RADIUS.sm : AVATAR_SIZE / 2,
          backgroundColor: Colors.cardElevated,
          borderWidth: aboutWatch ? 0 : StyleSheet.hairlineWidth,
          borderColor: Colors.border,
        }}
        contentFit="cover"
      />

      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              ...Typography.h3,
              color: Colors.textPrimary,
              fontSize: 16,
              fontWeight: unread ? "600" : "500",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {primaryTitle}
          </Text>
          {conversation.last_message ? (
            <Text
              style={{
                ...Typography.caption,
                color: unread ? Colors.textSecondary : Colors.textMuted,
                fontSize: 11,
                minWidth: 44,
                textAlign: "right",
              }}
            >
              {formatRelativeTime(conversation.last_message.created_at)}
            </Text>
          ) : null}
        </View>

        {subtitle ? (
          <Text
            style={{
              ...Typography.caption,
              color: Colors.textMuted,
              fontSize: 12,
              letterSpacing: 0.2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}

        {conversation.last_message ? (
          <Text
            style={{
              ...Typography.body,
              color: unread ? Colors.textPrimary : Colors.textMuted,
              fontSize: 14,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {conversation.last_message.text}
          </Text>
        ) : null}
      </View>

      {unread ? (
        <View
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: Colors.textPrimary,
            flexShrink: 0,
          }}
        />
      ) : (
        <View style={{ width: 9, flexShrink: 0 }} />
      )}
    </Pressable>
  );
}
