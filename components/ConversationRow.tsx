import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { UserAvatar } from "@/components/UserAvatar";
import {
  getConversationAvatarUri,
  getConversationDisplayName,
  getConversationUsername,
  isWatchConversation,
} from "@/lib/conversationDisplay";
import { formatRelativeTime } from "@/lib/utils";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { Conversation } from "@/types";

const AVATAR_SIZE = 52;
const LEADING_GAP = 12;

type Props = {
  conversation: Conversation;
  unread: boolean;
  onPress: () => void;
};

function createStyles() {
  return StyleSheet.create({
    row: {
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    rowPressed: {
      backgroundColor: Colors.card,
    },
    topLine: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    leading: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: LEADING_GAP,
      minWidth: 0,
    },
    titleBesideImage: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      gap: 1,
    },
    brand: {
      ...Typography.label,
      color: Colors.textSecondary,
      fontSize: 10,
      letterSpacing: 0.6,
    },
    watchTitle: {
      ...Typography.h3,
      color: Colors.textPrimary,
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 19,
    },
    primaryTitle: {
      ...Typography.h3,
      color: Colors.textPrimary,
      fontSize: 16,
      fontWeight: "500",
      lineHeight: 20,
    },
    primaryTitleUnread: {
      fontWeight: "600",
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
      paddingTop: 2,
    },
    time: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontSize: 11,
    },
    timeUnread: {
      color: Colors.textSecondary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.textPrimary,
    },
    subtitle: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontSize: 12,
      letterSpacing: 0.2,
      marginTop: 1,
    },
    listingThumb: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: RADIUS.sm,
      backgroundColor: Colors.cardElevated,
      flexShrink: 0,
    },
    listingThumbPlaceholder: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: RADIUS.sm,
      backgroundColor: Colors.cardElevated,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
  });
}

function ConversationAvatar({
  aboutWatch,
  avatarUri,
  styles,
}: {
  aboutWatch: boolean;
  avatarUri: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  if (aboutWatch) {
    if (avatarUri) {
      return (
        <Image source={{ uri: avatarUri }} style={styles.listingThumb} contentFit="cover" />
      );
    }
    return (
      <View style={styles.listingThumbPlaceholder}>
        <Ionicons name="image-outline" size={22} color={Colors.textMuted} />
      </View>
    );
  }

  return (
    <UserAvatar
      uri={avatarUri}
      size={AVATAR_SIZE}
      borderWidth={StyleSheet.hairlineWidth}
      borderColor={Colors.border}
    />
  );
}

export function ConversationRow({ conversation, unread, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const aboutWatch = isWatchConversation(conversation);
  const avatarUri = getConversationAvatarUri(conversation);
  const displayName = getConversationDisplayName(conversation);
  const username = getConversationUsername(conversation);
  const listing = conversation.listing;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.topLine}>
        <View style={styles.leading}>
          <ConversationAvatar
            aboutWatch={aboutWatch}
            avatarUri={avatarUri}
            styles={styles}
          />
          <View style={styles.titleBesideImage}>
            {aboutWatch && listing ? (
              <>
                <Text style={styles.brand} numberOfLines={1}>
                  {listing.brand}
                </Text>
                <Text
                  style={[styles.watchTitle, unread && styles.primaryTitleUnread]}
                  numberOfLines={1}
                >
                  {listing.model}
                </Text>
              </>
            ) : (
              <Text
                style={[styles.primaryTitle, unread && styles.primaryTitleUnread]}
                numberOfLines={2}
              >
                {displayName}
              </Text>
            )}
            {username ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {username}
              </Text>
            ) : null}
          </View>
        </View>

        {conversation.last_message ? (
          <View style={styles.timeRow}>
            <Text style={[styles.time, unread && styles.timeUnread]}>
              {formatRelativeTime(conversation.last_message.created_at)}
            </Text>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>
        ) : unread ? (
          <View style={styles.unreadDot} />
        ) : null}
      </View>
    </Pressable>
  );
}
